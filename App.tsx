// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FoodSearchScreen from './FoodSearchScreen'; // Adjust the path if necessary

const Stack = createNativeStackNavigator();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="FoodSearch">
        <Stack.Screen name="FoodSearch" component={FoodSearchScreen} options={{ title: 'Food Nutrition Finder' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;