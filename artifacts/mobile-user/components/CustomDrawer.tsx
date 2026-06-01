import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = 280;

interface CustomDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function CustomDrawer({ visible, onClose }: CustomDrawerProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const translateX = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(translateX, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateX, {
        toValue: -DRAWER_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => router.push(route as any), 250);
  };

  const handleSignOut = async () => {
    onClose();
    await signOut();
  };

  const navItems = [
    { label: "Profile", icon: "user" as const, route: "/profile" },
    { label: "Settings", icon: "settings" as const, route: "/settings" },
    { label: "Help & Support", icon: "help-circle" as const, route: "/help" },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          activeOpacity={1}
        />
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX }],
              backgroundColor: colors.background,
              paddingTop: insets.top,
              width: DRAWER_WIDTH,
            },
          ]}
        >
          {/* User Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text
                style={[styles.avatarText, { color: colors.primaryForeground }]}
              >
                {(user?.name ?? "U").charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.name, { color: colors.foreground }]}>
              {user?.name ?? "User"}
            </Text>
            <Text style={[styles.email, { color: colors.mutedForeground }]}>
              {user?.email ?? ""}
            </Text>
          </View>

          {/* Nav Items */}
          <View style={styles.nav}>
            {navItems.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.navItem}
                onPress={() => handleNavigate(item.route)}
              >
                <Feather name={item.icon} size={20} color={colors.foreground} />
                <Text style={[styles.navLabel, { color: colors.foreground }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sign Out */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <Feather name="log-out" size={18} color={colors.alert} />
              <Text style={[styles.signOutText, { color: colors.alert }]}>
                Sign out
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  drawer: {
    height: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    alignItems: "flex-start",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 24, fontFamily: "Inter_600SemiBold" },
  name: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  email: { fontSize: 13, fontFamily: "Inter_400Regular" },
  nav: { flex: 1, paddingTop: 12 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  navLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  footer: {
    padding: 24,
    borderTopWidth: 1,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  signOutText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
