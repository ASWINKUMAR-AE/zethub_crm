import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text } from 'react-native';
import { Home, FolderGit2, Calendar, CreditCard, Users, LogOut, UserPlus } from 'lucide-react-native';
import { COLORS, SPACING } from '../constants/theme';
import { useResponsiveLayout } from '../utils/responsive';
import CustomDrawerContent from '../components/CustomDrawerContent';
import { AuthContext } from '../context/AuthContext';
import { TouchableOpacity } from 'react-native';

// Screens
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import AdminProjectsScreen from '../screens/Admin/AdminProjectsScreen';
import AdminMilestonesScreen from '../screens/Admin/AdminMilestonesScreen';
import AdminPaymentsScreen from '../screens/Admin/AdminPaymentsScreen';
import AdminTeamScreen from '../screens/Admin/AdminTeamScreen';
import AdminMembersScreen from '../screens/Admin/AdminMembersScreen';
// Other screens would be created later...

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

const screenOptions = ({ route, navigation }) => ({
  headerShown: true,
  headerRight: () => <HeaderLogout />,
  tabBarActiveTintColor: COLORS.primary,
  tabBarInactiveTintColor: COLORS.textSecondary,
  drawerActiveTintColor: COLORS.surface,
  drawerActiveBackgroundColor: COLORS.primary,
  drawerInactiveTintColor: COLORS.textSecondary,
  tabBarIcon: ({ color, size }) => {
    switch (route.name) {
      case 'Dashboard': return <Home color={color} size={size} />;
      case 'Projects': return <FolderGit2 color={color} size={size} />;
      case 'Milestones': return <Calendar color={color} size={size} />;
      case 'Payments': return <CreditCard color={color} size={size} />;
      case 'Team': return <Users color={color} size={size} />;
      case 'Members': return <UserPlus color={color} size={size} />;
      default: return null;
    }
  },
  drawerIcon: ({ color, size }) => {
    switch (route.name) {
      case 'Dashboard': return <Home color={color} size={size} />;
      case 'Projects': return <FolderGit2 color={color} size={size} />;
      case 'Milestones': return <Calendar color={color} size={size} />;
      case 'Payments': return <CreditCard color={color} size={size} />;
      case 'Team': return <Users color={color} size={size} />;
      case 'Members': return <UserPlus color={color} size={size} />;
      default: return null;
    }
  }
});

const getScreens = (Nav) => (
  <>
    <Nav.Screen name="Dashboard" component={AdminDashboardScreen} />
    <Nav.Screen name="Projects" component={AdminProjectsScreen} />
    <Nav.Screen name="Milestones" component={AdminMilestonesScreen} />
    <Nav.Screen name="Payments" component={AdminPaymentsScreen} />
    <Nav.Screen name="Team" component={AdminTeamScreen} />
    <Nav.Screen name="Members" component={AdminMembersScreen} />
  </>
);

export default function AdminNavigator() {
  const { isDesktop } = useResponsiveLayout();

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
