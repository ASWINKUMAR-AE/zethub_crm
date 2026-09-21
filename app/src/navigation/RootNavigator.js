import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { COLORS } from '../constants/theme';

import LoginScreen from '../screens/Auth/LoginScreen';
import AdminNavigator from './AdminNavigator';
import TeamNavigator from './TeamNavigator';
import ClientNavigator from './ClientNavigator';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { userToken, userRole, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken == null ? (
          // No token found, user isn't signed in
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          // User is signed in
          <>
            {userRole === 'admin' && <Stack.Screen name="Admin" component={AdminNavigator} />}
            {userRole === 'team' && <Stack.Screen name="Team" component={TeamNavigator} />}
            {userRole === 'client' && <Stack.Screen name="Client" component={ClientNavigator} />}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
