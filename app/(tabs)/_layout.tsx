import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
    <Tabs.Screen
      name="index"
      options={{
        title: 'Home',
        tabBarIcon: ({ size, focused }) => (
          <Ionicons name="home" size={size} color="#000000" />
        ),
      }}
    />
      <Tabs.Screen
        name="add-invoice"
        options={{
          title: 'Add Invoice',
          tabBarIcon: ({ size }) => (
            <Ionicons name="add-circle" size={size} color="#28a745" /> // vert fixe
          ),
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: 'Invoices',
          tabBarIcon: ({ size }) => (
            <Ionicons name="document-text" size={size} color="#ffc107" /> // jaune fixe
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size }) => (
            <Ionicons name="person" size={size} color="#dc3545" /> // rouge fixe
          ),
        }}
      />
    </Tabs>
  );
}
