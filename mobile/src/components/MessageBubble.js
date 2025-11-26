// src/components/MessageBubble. js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MessageBubble({ message, isOwn }) {
  return (
    <View style={[styles.container, isOwn ?  styles. ownContainer : styles.otherContainer]}>
      <View style={[styles.bubble, isOwn ?  styles.ownBubble : styles.otherBubble]}>
        <Text style={[styles.text, isOwn ?  styles.ownText : styles. otherText]}>
          {message.text}
        </Text>
        <Text style={[styles.time, isOwn ? styles. ownTime : styles.otherTime]}>
          {message.time}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 5,
    maxWidth: '75%',
  },
  ownContainer: {
    alignSelf: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  ownBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownText: {
    color: '#fff',
  },
  otherText: {
    color: '#333',
  },
  time: {
    fontSize: 11,
    marginTop: 4,
  },
  ownTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  otherTime: {
    color: '#999',
  },
});