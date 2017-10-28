import { EventEmitter } from 'events'
import { DeviceEventEmitter, NativeModules } from 'react-native'
import Peer from './Peer'

const RCTMultipeerConnectivity = NativeModules.MultipeerConnectivity

export default class MultipeerConnection extends EventEmitter {
  constructor() {
    super()
    this._peers = []
    this._connectedPeers = []
    this._lostPeers = []

    this.get = peerId => this._peers.find(peer => peer.id === peerId)
    this.found = peer => this._peers.push(peer)
    this.connected = peer => (peer.connected = true)
    this.lost = peer => {
      this._peers = this._peers.filter(p => p.id !== peer.id)
      peer.connected = false
      this._lostPeers.push(peer)
    }

    const peerFound = DeviceEventEmitter.addListener(
      'RCTMultipeerConnectivityPeerFound',
      (event => {
        const peer = new Peer(event.peer.id, event.peer.info.name)
        this.found(peer)
        this.emit('peerFound', { peer })
      }).bind(this)
    )

    const peerLost = DeviceEventEmitter.addListener(
      'RCTMultipeerConnectivityPeerLost',
      (event => {
        const peer = this.get(event.peer.id)
        this.lost(peer)
        this.emit('peerLost', { peer })
      }).bind(this)
    )

    const peerConnected = DeviceEventEmitter.addListener(
      'RCTMultipeerConnectivityPeerConnected',
      (event => {
        const peer = this.get(event.peer.id)
        this.connected(peer)
        this.emit('peerConnected', { peer })
      }).bind(this)
    )

    const peerConnecting = DeviceEventEmitter.addListener(
      'RCTMultipeerConnectivityPeerConnecting',
      (event => {
        const peer = this.get(event.peer.id)
        this.emit('peerConnecting', { peer })
      }).bind(this)
    )

    const peerDisconnected = DeviceEventEmitter.addListener(
      'RCTMultipeerConnectivityPeerDisconnected',
      (event => {
        const peer = this.get(event.peer.id)
        this.lost(peer)
        this.emit('peerDisconnected', { peer })
      }).bind(this)
    )

    // const streamOpened = DeviceEventEmitter.addListener(
    //   'RCTMultipeerConnectivityStreamOpened',
    //   (event => {
    //     this.emit('streamOpened', event);
    //   }).bind(this),
    // );

    const invited = DeviceEventEmitter.addListener(
      'RCTMultipeerConnectivityInviteReceived',
      (event => {
        const peer = this.get(event.peer.id)
        this.emit('inviteReceived', { peer, invitationId: event.invite.id })
      }).bind(this)
    )

    const dataReceived = DeviceEventEmitter.addListener(
      'RCTMultipeerConnectivityDataReceived',
      (event => {
        const peer = this.get(event.sender.id)
        this.emit('dataReceived', { peer, data: event.data })
      }).bind(this)
    )
  }

  getAllPeers() {
    return this._peers
  }

  getLostPeers() {
    return this._lostPeers
  }

  send(recipients, data, callback) {
    if (!callback) {
      callback = () => {}
    }

    const recipientIds = recipients.map(recipient => {
      if (recipient instanceof Peer) {
        return recipient.id
      }
      return recipient
    })

    RCTMultipeerConnectivity.send(recipientIds, data, callback)
  }

  broadcast(data, callback) {
    if (!callback) {
      callback = () => {}
    }
    RCTMultipeerConnectivity.broadcast(data, callback)
  }

  invite(peerId, callback) {
    if (!callback) {
      callback = () => {}
    }
    RCTMultipeerConnectivity.invite(peerId, callback)
  }

  rsvp(inviteId, accept, callback) {
    if (!callback) {
      callback = () => {}
    }
    RCTMultipeerConnectivity.rsvp(inviteId, accept, callback)
  }

  advertise(channel, info) {
    RCTMultipeerConnectivity.advertise(channel, info)
  }

  browse(channel) {
    RCTMultipeerConnectivity.browse(channel)
  }
}
