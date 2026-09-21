import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Keyboard,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import 'react-native-get-random-values';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { v4 as uuidv4 } from 'uuid';
import { messageAPI, userAPI } from '../services/api';
import { socket } from '../services/socket';

// Theme
const PRIMARY_COLOR = "#050505ff";
const SECONDARY_COLOR = "#64748B";
const BG_COLOR = "#F8FAFC";
const CARD_BG = "#FFFFFF";
const SELF_BUBBLE = "#2563EB";
const OTHER_BUBBLE = "#F1F5F9";
const TEXT_PRIMARY = "#1E293B";
const TEXT_SECONDARY = "#64748B";
const BORDER_COLOR = "#E2E8F0";
const SUCCESS_COLOR = "#10B981";

export default function MessageScreen({
  rideId: propRideId,
  selfId: propSelfId,
  receiverId: propReceiverId,
  selfRole: propSelfRole = "rider",
  inPopup = false,
  onClose = () => {}
}) {

 

  // Final params resolved
  const rideId = propRideId ?? route.params?.rideId;
  const selfId = propSelfId ?? route.params?.selfId;
  const receiverId = propReceiverId ?? route.params?.receiverId;
  const selfRole = propSelfRole ?? route.params?.selfRole ?? "rider";

  console.log("CHAT DEBUG:", { rideId, selfId, receiverId, selfRole, inPopup });


  // State
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const flatListRef = useRef();
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const typingAnim = useRef(new Animated.Value(0)).current;
  const messageAnimations = useRef(new Map()).current;

  // -------- CHECK RIDE STATUS --------
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await userAPI.getStatus();
        if (res.status === "notInRide") {
          navigation.replace("HomeScreen");
        } else if (res.status === "searchingRide") {
          navigation.replace("RidePendingScreen", { requestId: res.requestId });
        }
      } catch (e) {}
    };
    checkStatus();
  }, []);

  // -------- KEYBOARD HANDLER FIXED --------
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      showSub?.remove?.();
      hideSub?.remove?.();
    };
  }, []);

  // -------- LOAD + SOCKET --------
  useEffect(() => {
    if (!rideId || !selfId) return;

    const load = async () => {
      try {
        const res = await messageAPI.getMessages(rideId);
        if (res?.success) {
          setMessages(
            res.messages.map(m => ({
              ...m,
              localUUID: m.id ? undefined : uuidv4(),
              timestamp: m.timestamp || new Date().toISOString(),
            }))
          );
        }
      } catch (e) {}
    };
    load();

    socket.emit("joinRiderRoom", { userId: selfId });

    const onIncoming = msg => {
      if (msg.rideId !== rideId) return;

      setMessages(prev => {
        const dup = prev.some(m =>
          (msg.id && m.id === msg.id) ||
          (msg.localUUID && m.localUUID === msg.localUUID)
        );
        if (dup) return prev;

        const newMsg = {
          ...msg,
          localUUID: msg.id ? undefined : uuidv4(),
          timestamp: msg.timestamp || new Date().toISOString(),
        };
        messageAnimations.set(newMsg.localUUID || newMsg.id, new Animated.Value(0));

        return [...prev, newMsg];
      });

      triggerTyping();
    };

    socket.on("newMessage", onIncoming);
    return () => socket.off("newMessage", onIncoming);
  }, [rideId, selfId]);

  // -------- TYPING INDICATOR --------
  const triggerTyping = () => {
    setIsTyping(true);
    Animated.sequence([
      Animated.timing(typingAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(typingAnim, { toValue: 0, duration: 200, useNativeDriver: true })
    ]).start(() => setIsTyping(false));
  };

  // -------- SEND MESSAGE --------
  const sendMessage = async () => {
    if (!input.trim()) return;

    const localUUID = uuidv4();
    const payload = {
      rideId,
      from: selfId,
      to: receiverId,
      content: input.trim(),
      role: selfRole,
      localUUID,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => {
      messageAnimations.set(localUUID, new Animated.Value(0));
      return [...prev, payload];
    });

    setInput("");

    Animated.sequence([
      Animated.spring(sendButtonScale, { toValue: 0.8, useNativeDriver: true }),
      Animated.spring(sendButtonScale, { toValue: 1, useNativeDriver: true })
    ]).start();

    try {
      await messageAPI.sendMessage(payload);
    } catch (e) {
      console.log("Send error", e);
    }
  };

  // -------- ANIMATE NEW MESSAGES --------
  useEffect(() => {
    messages.forEach(msg => {
      const anim = messageAnimations.get(msg.localUUID || msg.id);
      if (anim && anim._value === 0) {
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }).start();
      }
    });
  }, [messages]);

  // -------- RENDER MESSAGE BUBBLE --------
  const renderMessage = ({ item }) => {
    if (!item) return null;

    const isSelf = item.role === selfRole;
    const anim = messageAnimations.get(item.localUUID || item.id) || new Animated.Value(1);

    return (
      <Animated.View
        style={[
          styles.msgRow,
          { alignSelf: isSelf ? "flex-end" : "flex-start" },
          {
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                })
              },
              {
                scale: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 1],
                })
              }
            ]
          }
        ]}
      >
        <View style={[styles.bubble, isSelf ? styles.selfBubble : styles.otherBubble]}>
          <Text style={[styles.msgText, isSelf && styles.selfText]}>{item.content}</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat with Driver</Text>
      
      </View>

      {/* CHAT LIST */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, i) => item.id || item.localUUID || i.toString()}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

   {/* INPUT BAR FIXED AT BOTTOM */}
<View
  style={[
    styles.inputBar,
    {
      position: "absolute",
      bottom: 0,  // Handles keyboard height
      left: 0,
      margin:20,
      borderRadius:50,
      right: 0,
    },
  ]}
>
  <TextInput
    style={styles.textInput}
    placeholder="Type a message..."
    value={input}
    onChangeText={setInput}
    multiline
  />
  <TouchableOpacity onPress={sendMessage}>
    <Animated.View style={{ transform: [{ scale: sendButtonScale }] , marginBottom:10,}}>
      <Icon name="send" size={24} color={PRIMARY_COLOR} />
    </Animated.View>
  </TouchableOpacity>
</View>

    </SafeAreaView>
  );
}

// -------- STYLES --------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_COLOR , 
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: BORDER_COLOR,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: TEXT_PRIMARY },
  closeBtn: { padding: 8 },
  msgRow: { marginVertical: 4, maxWidth: "75%" ,},
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  selfBubble: { backgroundColor: SELF_BUBBLE },
  otherBubble: { backgroundColor: OTHER_BUBBLE },
  msgText: { fontSize: 16, color: TEXT_PRIMARY },
  selfText: { color: "#fff" },
  inputBar: {
    flexDirection: "row",
    backgroundColor: '#ffffffd6',
    borderTopWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 12,
    alignItems: "flex-end"
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 120,
    marginRight: 10,
  },
});
