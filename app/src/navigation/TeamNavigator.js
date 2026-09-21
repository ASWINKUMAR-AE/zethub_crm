import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, TouchableOpacity } from 'react-native';
import { Home, FolderGit2, Calendar, LogOut } from 'lucide-react-native';
import { COLORS, SPACING } from '../constants/theme';
import { useResponsiveLayout } from '../utils/responsive';
import CustomDrawerContent from '../components/CustomDrawerContent';
import { AuthContext } from '../context/AuthContext';

// Screens
import TeamDashboardScreen from '../screens/Team/TeamDashboardScreen';
import TeamProjectsScreen from '../screens/Team/TeamProjectsScreen';
import TeamMilestonesScreen from '../screens/Team/TeamMilestonesScreen';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

const EmptyScreen = ({ route }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>{route.name}</Text>
  </View>
);

const HeaderLogout = () => {
  const { logout } = React.useContext(AuthContext);
  return (
    <TouchableOpacity onPress={() => logout()} style={{ marginRight: SPACING.md }}>
      <LogOut color={COLORS.error} size={24} />
    </TouchableOpacity>
  );
};

const getScreens = (Nav) => (
  <>
    <Nav.Screen name="Dashboard" component={TeamDashboardScreen} />
    <Nav.Screen name="My Projects" component={TeamProjectsScreen} />
    <Nav.Screen name="Milestones" component={TeamMilestonesScreen} />
  </>
);

export default function TeamNavigator() {
  const { isDesktop } = useResponsiveLayout();

  const screenOptions = (props) => ({
    headerShown: true,
    headerRight: () => <HeaderLogout />,
    tabBarActiveTintColor: COLORS.primary,
    tabBarInactiveTintColor: COLORS.textSecondary,
    drawerActiveTintColor: COLORS.surface,
    drawerActiveBackgroundColor: COLORS.primary,
    drawerInactiveTintColor: COLORS.textSecondary,
    tabBarIcon: ({ color, size }) => {
      switch (props.route.name) {
        case 'Dashboard': return <Home color={color} size={size} />;
        case 'My Projects': return <FolderGit2 color={color} size={size} />;
        case 'Milestones': return <Calendar color={color} size={size} />;
        default: return null;
      }
    },
    drawerIcon: ({ color, size }) => {
      switch (props.route.name) {
        case 'Dashboard': return <Home color={color} size={size} />;
        case 'My Projects': return <FolderGit2 color={color} size={size} />;
        case 'Milestones': return <Calendar color={color} size={size} />;
        default: return null;
      }
    }
  });

  if (isDesktop) {
    return (
      <Drawer.Navigator 
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{ ...screenOptions, drawerType: 'permanent' }} 
        initialRouteName="Dashboard"
      >
        {getScreens(Drawer)}
      </Drawer.Navigator>
    );
  }

  return (
    <Tab.Navigator screenOptions={screenOptions} initialRouteName="Dashboard">
      {getScreens(Tab)}
    </Tab.Navigator>
  );
}
