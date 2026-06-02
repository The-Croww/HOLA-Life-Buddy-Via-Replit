import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DS } from "@/constants/design";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = 290;
const ACCENT = "#3DD68C";

interface AdminDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function AdminDrawer({ visible, onClose }: AdminDrawerProps) {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const translateX = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : -DRAWER_WIDTH,
      duration: visible ? 240 : 200,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => router.push(route as any), 240);
  };

  const handleSignOut = () => {
    onClose();
    setTimeout(() => {
      Alert.alert("Sign out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign out", style: "destructive", onPress: signOut },
      ]);
    }, 300);
  };

  const initial = (user?.name ?? "P").charAt(0).toUpperCase();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX }],
              paddingTop: insets.top + 8,
              paddingBottom: insets.bottom + 16,
              width: DRAWER_WIDTH,
            },
          ]}
        >
          {/* Brand strip */}
          <View style={styles.brand}>
            <View style={styles.brandDot}>
              <Text style={styles.brandDotText}>🌱</Text>
            </View>
            <View>
              <Text style={styles.brandName}>HOLA!</Text>
              <Text style={styles.brandSub}>Clinician Portal</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close menu">
              <Feather name="x" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Profile card */}
          <View style={styles.profileCard}>
            <View style={[styles.avatar, { backgroundColor: ACCENT }]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName} numberOfLines={1}>{user?.name ?? "Clinician"}</Text>
              <Text style={styles.profileEmail} numberOfLines={1}>{user?.email ?? ""}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {(user?.role ?? "psychologist").toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Nav items */}
          <View style={styles.nav}>
            <Text style={styles.navSection}>ACCOUNT</Text>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleNavigate("/(admin)/profile")}
              activeOpacity={0.7}
            >
              <View style={[styles.navIcon, { backgroundColor: ACCENT + "22" }]}>
                <Feather name="user" size={16} color={ACCENT} />
              </View>
              <Text style={styles.navLabel}>My Profile</Text>
              <Feather name="chevron-right" size={14} color="#555" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleNavigate("/(admin)/analytics")}
              activeOpacity={0.7}
            >
              <View style={[styles.navIcon, { backgroundColor: "#6366F122" }]}>
                <Feather name="bar-chart-2" size={16} color="#6366F1" />
              </View>
              <Text style={styles.navLabel}>Analytics</Text>
              <Feather name="chevron-right" size={14} color="#555" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleNavigate("/(admin)/alerts")}
              activeOpacity={0.7}
            >
              <View style={[styles.navIcon, { backgroundColor: "#EF444422" }]}>
                <Feather name="bell" size={16} color="#EF4444" />
              </View>
              <Text style={styles.navLabel}>Alerts</Text>
              <Feather name="chevron-right" size={14} color="#555" />
            </TouchableOpacity>
          </View>

          {/* Sign out */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
              <Feather name="log-out" size={16} color="#EF4444" />
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Backdrop */}
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
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
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  drawer: {
    height: "100%",
    backgroundColor: "#111113",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 16,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2e",
  },
  brandDot: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#3DD68C22",
    alignItems: "center",
    justifyContent: "center",
  },
  brandDotText: { fontSize: 18 },
  brandName: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff", lineHeight: 18 },
  brandSub: { fontSize: 10, color: "#555", marginTop: 1 },
  closeBtn: {
    marginLeft: "auto",
    padding: 4,
    minWidth: 32,
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    margin: 16,
    padding: 14,
    backgroundColor: "#1a1a1e",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2a2e",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  profileName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#f0f0f0", marginBottom: 2 },
  profileEmail: { fontSize: 11, color: "#666", marginBottom: 6 },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#3DD68C22",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#3DD68C44",
  },
  roleText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#3DD68C", letterSpacing: 0.8 },
  nav: { flex: 1, paddingHorizontal: 12, paddingTop: 8 },
  navSection: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "#555",
    letterSpacing: 1,
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 6,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 2,
    minHeight: 48,
  },
  navIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", color: "#ccc" },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2e",
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#2a0f0f",
    borderWidth: 1,
    borderColor: "#EF444430",
    minHeight: 48,
  },
  signOutText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#EF4444" },
});
