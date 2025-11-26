// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';

import ChatsScreen from './src/screens/ChatsScreen';
import ConversationScreen from './src/screens/ConversationScreen';
import { APP_NAME } from './src/config';

const Stack = createStackNavigator();

export default function App() {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen 
            name="Chats" 
            component={ChatsScreen}
            options={{ 
              title: APP_NAME,
              headerStyle: { backgroundColor: '#007AFF' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold', fontSize: 22 }
            }}
          />
          <Stack.Screen 
            name="Conversation" 
            component={ConversationScreen}
            options={({ route }) => ({ 
              title: route.params?. chatName || 'Conversa',
              headerBackTitle: 'Voltar'
            })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}