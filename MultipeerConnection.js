import React from 'react';
import { EventEmitter } from 'events';
import { DeviceEventEmitter, NativeModules } from 'react-native';
import Peer from './Peer';

const RCTMultipeerConnectivity = NativeModules.MultipeerConnectivity;

export default class MultipeerConnection extends EventEmitter {
  constructor() {
    super();
    this._peers = {};
    this._connectedPeers = {};
    const peerFound = DeviceEventEmitter.addListener(
      'RCTMultipeerConnectivityPeerFound',
      (event => {
        const peer = new Peer(event.peer.id, event.peer.info.name);
        this._peers[peer.id] = peer;
        this.emit('peerFound', {peer});
      }).bind(this),
    );

    const peerLost = DeviceEventEmitter.addListener(
      'RCTMultipeerConnectivityPeerLost',
      (event => {
        const peer = this._peers[event.peer.id];
        this.emit('peerLost', {peer: {id: peer.id}});
        delete this._peers[event.peer.id];
        delete this._connectedPeers[event.peer.id];
      }).bind(this),
    );

    const peerConnected = DeviceEventEmitter.addListener(
      'RCTMultipeerConnectivityPeerConnected',
      (event => {
        this._connectedPeers[event.peer.id] = this._peers[event.peer.id];
        this.emit('peerConnected', event);
      }).bind(this),
    );

    const peerConnecting = DeviceEventEmitter.addListener(
      'RCTMultipeerConnectivityPeerConnecting',
      (event => {
        this.emit('peerConnecting', event);
      }).bind(this),
    );

    const peerDisconnected = DeviceEventEmitter.addListener(
      'RCTMultipeerConnectivityPeerDisconnected',
      (event => {
        delete this._connectedPeers[event.peer.id];
        this.emit('peerDisconnected', event);
      }).bind(this),
    );

    const streamOpened = DeviceEventEmitter.addListener(
      'RCTMultipeerConnectivityStreamOpened',
      (event => {
        this.emit('streamOpened', event);
      }).bind(this),
    );

    const invited = DeviceEventEmitter.addListener(
      'RCTMultipeerConnectivityInviteReceived',
      (event => {
        this.emit('inviteReceived', event);
      }).bind(this),
    );

    const dataReceived = DeviceEventEmitter.addListener(
      'RCTMultipeerConnectivityDataReceived',
      (event => {
        event.sender = this._peers[event.sender.id];
        this.emit('dataReceived', event);
      }).bind(this),
    );
  }

  getAllPeers() {
    return this._peers;
  }

  getConnectedPeers() {
    return this._connectedPeers;
  }

  send(recipients, data, callback) {
    if (!callback) {
      callback = () => {};
    }

    const recipientIds = recipients.map(recipient => {
      if (recipient instanceof Peer) {
        return recipient.id;
      }
      return recipient;
    });

    RCTMultipeerConnectivity.send(recipientIds, data, callback);
  }

  broadcast(data, callback) {
    if (!callback) {
      callback = () => {};
    }
    RCTMultipeerConnectivity.broadcast(data, callback);
  }

  invite(peerId, callback) {
    if (!callback) {
      callback = () => {};
    }
    RCTMultipeerConnectivity.invite(peerId, callback);
  }

  rsvp(inviteId, accept, callback) {
    if (!callback) {
      callback = () => {};
    }
    RCTMultipeerConnectivity.rsvp(inviteId, accept, callback);
  }

  advertise(channel, info) {
    RCTMultipeerConnectivity.advertise(channel, info);
  }

  browse(channel) {
    RCTMultipeerConnectivity.browse(channel);
  }
}
