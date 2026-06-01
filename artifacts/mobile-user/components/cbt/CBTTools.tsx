import React, { useState, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
  ScrollView, Animated, Alert, FlatList, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAdminFetch } from "@/hooks/useAdminApi";

const DISTORTIONS = [
  "Catastrophizing", "Mind reading", "All-or-nothing", "Overgeneralization",
  "Emotional reasoning", "Should statements", "Personalization", "Mental filter",
];

const SENSES = [
  { count: 5, label: "SEE 👁️", placeholder: "e.g. my hands, a plant, the ceiling..." },
  { count: 4, label: "HEAR 👂", placeholder: "e.g. traffic, birds, a fan..." },
  { count: 3, label: "TOUCH 🤚", placeholder: "e.g. my chair, my clothes, the floor..." },
  { count: 2, label: "SMELL 👃", placeholder: "e.g. coffee, fresh air, nothing..." },
  { count: 1, label: "TASTE 👅", placeholder: "e.g. gum, water, nothing right now..." },
];

export function WorryBoxModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const [text, setText] = useState("");
  const [worries, setWorries] = useState<string[]>([]);
  const [showing, setShowing] = useState<"input" | "list">("input");
  const boxScale = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;

  const load = useCallback(async () => {
    const raw = await AsyncStorage.getItem("hola_worries");
    if (raw) setWorries(JSON.parse(raw));
  }, []);

  const lockAway = useCallback(async () => {
    if (!text.trim()) return;
    Animated.sequence([
      Animated.timing(textOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.spring(boxScale, { toValue: 1.15, useNativeDriver: true }),
      Animated.spring(boxScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    const next = [text.trim(), ...worries].slice(0, 50);
    setWorries(next);
    await AsyncStorage.setItem("hola_worries", JSON.stringify(next));
    setText("");
    setTimeout(() => {
      textOpacity.setValue(1);
    }, 400);
  }, [text, worries, boxScale, textOpacity]);

  const deleteWorry = async (idx: number) => {
    const next = worries.filter((_, i) => i !== idx);
    setWorries(next);
    await AsyncStorage.setItem("hola_worries", JSON.stringify(next));
  };

  const handleOpen = () => { load(); };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onShow={handleOpen}>
      <SafeAreaView style={[s.modal, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={[s.mHeader, { borderColor: colors.border }]}>
          <Text style={[s.mTitle, { color: colors.foreground }]}>📦 Worry Box</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={22} color={colors.foreground} /></TouchableOpacity>
        </View>
        <View style={[s.segRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {(["input", "list"] as const).map((v) => (
            <TouchableOpacity key={v} style={[s.seg, showing === v && { backgroundColor: colors.foreground }]} onPress={() => setShowing(v)}>
              <Text style={[s.segText, { color: showing === v ? colors.background : colors.mutedForeground }]}>{v === "input" ? "Lock a worry" : `Locked (${worries.length})`}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {showing === "input" ? (
          <ScrollView contentContainerStyle={s.mContent}>
            <Text style={[s.hint, { color: colors.mutedForeground }]}>Write what's weighing on you. Once locked away, it's out of your head.</Text>
            <Animated.View style={{ opacity: textOpacity }}>
              <TextInput
                style={[s.bigInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                multiline
                placeholder="What's worrying you right now?"
                placeholderTextColor={colors.border}
                value={text}
                onChangeText={setText}
                textAlignVertical="top"
              />
            </Animated.View>
            <Animated.View style={{ transform: [{ scale: boxScale }], alignItems: "center" }}>
              <Text style={{ fontSize: 60 }}>📦</Text>
            </Animated.View>
            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: colors.foreground, opacity: text.trim() ? 1 : 0.4 }]}
              onPress={lockAway}
              disabled={!text.trim()}
              activeOpacity={0.85}
            >
              <Feather name="lock" size={16} color={colors.background} />
              <Text style={[s.primaryBtnText, { color: colors.background }]}>Lock it away</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <FlatList
            data={worries}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={s.mContent}
            ListEmptyComponent={<Text style={[s.emptyText, { color: colors.mutedForeground }]}>No worries locked yet. 🎉</Text>}
            renderItem={({ item, index }) => (
              <View style={[s.worryRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[s.worryText, { color: colors.foreground }]} numberOfLines={3}>{item}</Text>
                <TouchableOpacity onPress={() => deleteWorry(index)} style={s.deleteBtn}>
                  <Feather name="trash-2" size={16} color={colors.alert} />
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

export function GratitudeJarModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const [text, setText] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [showing, setShowing] = useState<"input" | "list">("input");
  const jarScale = useRef(new Animated.Value(1)).current;

  const load = useCallback(async () => {
    const raw = await AsyncStorage.getItem("hola_gratitude");
    if (raw) setItems(JSON.parse(raw));
  }, []);

  const addItem = useCallback(async () => {
    if (!text.trim()) return;
    Animated.sequence([
      Animated.spring(jarScale, { toValue: 1.2, useNativeDriver: true }),
      Animated.spring(jarScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    const next = [text.trim(), ...items].slice(0, 100);
    setItems(next);
    await AsyncStorage.setItem("hola_gratitude", JSON.stringify(next));
    setText("");
  }, [text, items, jarScale]);

  const deleteItem = async (idx: number) => {
    const next = items.filter((_, i) => i !== idx);
    setItems(next);
    await AsyncStorage.setItem("hola_gratitude", JSON.stringify(next));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onShow={load}>
      <SafeAreaView style={[s.modal, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={[s.mHeader, { borderColor: colors.border }]}>
          <Text style={[s.mTitle, { color: colors.foreground }]}>🫙 Gratitude Jar</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={22} color={colors.foreground} /></TouchableOpacity>
        </View>
        <View style={[s.segRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {(["input", "list"] as const).map((v) => (
            <TouchableOpacity key={v} style={[s.seg, showing === v && { backgroundColor: colors.foreground }]} onPress={() => setShowing(v)}>
              <Text style={[s.segText, { color: showing === v ? colors.background : colors.mutedForeground }]}>{v === "input" ? "Add to jar" : `In jar (${items.length})`}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {showing === "input" ? (
          <ScrollView contentContainerStyle={s.mContent}>
            <Text style={[s.hint, { color: colors.mutedForeground }]}>What's one thing you're grateful for today? Big or small.</Text>
            <TextInput
              style={[s.bigInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              multiline
              placeholder="I'm grateful for..."
              placeholderTextColor={colors.border}
              value={text}
              onChangeText={setText}
              textAlignVertical="top"
            />
            <Animated.View style={{ transform: [{ scale: jarScale }], alignItems: "center" }}>
              <Text style={{ fontSize: 60 }}>🫙</Text>
              <Text style={[s.jarCount, { color: colors.mutedForeground }]}>{items.length} thing{items.length !== 1 ? "s" : ""} inside</Text>
            </Animated.View>
            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: "#3DD68C", opacity: text.trim() ? 1 : 0.4 }]}
              onPress={addItem}
              disabled={!text.trim()}
              activeOpacity={0.85}
            >
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" }}>Add to jar ✨</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={s.mContent}
            ListEmptyComponent={<Text style={[s.emptyText, { color: colors.mutedForeground }]}>Your jar is empty — add something grateful!</Text>}
            renderItem={({ item, index }) => (
              <View style={[s.worryRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ fontSize: 16, marginRight: 4 }}>✨</Text>
                <Text style={[s.worryText, { color: colors.foreground, flex: 1 }]}>{item}</Text>
                <TouchableOpacity onPress={() => deleteItem(index)} style={s.deleteBtn}>
                  <Feather name="trash-2" size={16} color={colors.alert} />
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

export function ThoughtReframeModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const apiFetch = useAdminFetch();
  const [step, setStep] = useState(0);
  const [thought, setThought] = useState("");
  const [distortion, setDistortion] = useState("");
  const [reframe, setReframe] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ thought: string; distortion: string; reframe: string }>>([]);
  const [showHistory, setShowHistory] = useState(false);

  const loadHistory = useCallback(async () => {
    const raw = await AsyncStorage.getItem("hola_reframes");
    if (raw) setHistory(JSON.parse(raw));
  }, []);

  const reset = () => { setStep(0); setThought(""); setDistortion(""); setReframe(""); };

  const aiHelp = async () => {
    setAiLoading(true);
    try {
      const res = await apiFetch("/v1/mindfulness/reframe", {
        method: "POST",
        body: JSON.stringify({ thought, distortion }),
      });
      if (res?.suggestion) setReframe(res.suggestion);
    } catch {
      setReframe("Try to find evidence for and against this thought. What would you say to a friend in this situation?");
    } finally {
      setAiLoading(false);
    }
  };

  const save = async () => {
    const entry = { thought, distortion, reframe };
    const raw = await AsyncStorage.getItem("hola_reframes");
    const prev = raw ? JSON.parse(raw) : [];
    const next = [entry, ...prev].slice(0, 30);
    await AsyncStorage.setItem("hola_reframes", JSON.stringify(next));
    setHistory(next);
    Alert.alert("Saved!", "Your reframe has been saved to history.", [{ text: "Great", onPress: reset }]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onShow={loadHistory}>
      <SafeAreaView style={[s.modal, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={[s.mHeader, { borderColor: colors.border }]}>
          <TouchableOpacity onPress={() => { setShowHistory(!showHistory); }}>
            <Feather name="clock" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
          <Text style={[s.mTitle, { color: colors.foreground }]}>🔄 Thought Reframe</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={22} color={colors.foreground} /></TouchableOpacity>
        </View>

        {showHistory ? (
          <FlatList
            data={history}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={s.mContent}
            ListEmptyComponent={<Text style={[s.emptyText, { color: colors.mutedForeground }]}>No reframes saved yet.</Text>}
            renderItem={({ item }) => (
              <View style={[s.histCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[s.histLabel, { color: colors.mutedForeground }]}>Thought</Text>
                <Text style={[s.histText, { color: colors.foreground }]}>{item.thought}</Text>
                <Text style={[s.histLabel, { color: colors.mutedForeground, marginTop: 6 }]}>Distortion · {item.distortion}</Text>
                <Text style={[s.histLabel, { color: colors.mutedForeground, marginTop: 6 }]}>Reframe</Text>
                <Text style={[s.histText, { color: colors.calm ?? "#3DD68C" }]}>{item.reframe}</Text>
              </View>
            )}
          />
        ) : (
          <ScrollView contentContainerStyle={s.mContent}>
            <View style={s.stepBar}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[s.stepDot, { backgroundColor: i <= step ? colors.foreground : colors.border }]} />
              ))}
            </View>

            {step === 0 && (
              <>
                <Text style={[s.stepLabel, { color: colors.foreground }]}>Step 1: The negative thought</Text>
                <Text style={[s.hint, { color: colors.mutedForeground }]}>Write the thought exactly as it appeared in your mind.</Text>
                <TextInput
                  style={[s.bigInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  multiline placeholder="e.g. 'I always mess everything up...'" placeholderTextColor={colors.border}
                  value={thought} onChangeText={setThought} textAlignVertical="top"
                />
                <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.foreground, opacity: thought.trim() ? 1 : 0.4 }]} onPress={() => setStep(1)} disabled={!thought.trim()} activeOpacity={0.85}>
                  <Text style={[s.primaryBtnText, { color: colors.background }]}>Next →</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 1 && (
              <>
                <Text style={[s.stepLabel, { color: colors.foreground }]}>Step 2: Cognitive distortion</Text>
                <Text style={[s.hint, { color: colors.mutedForeground }]}>Which pattern does this thought fall into?</Text>
                <View style={s.distortionGrid}>
                  {DISTORTIONS.map((d) => (
                    <TouchableOpacity key={d} style={[s.distChip, { borderColor: distortion === d ? colors.calm : colors.border, backgroundColor: distortion === d ? (colors.calm + "18") : colors.card }]} onPress={() => setDistortion(d)}>
                      <Text style={[s.distChipText, { color: distortion === d ? colors.calm : colors.foreground }]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity style={[s.outlineBtn, { borderColor: colors.border, flex: 1 }]} onPress={() => setStep(0)}>
                    <Text style={[s.outlineBtnText, { color: colors.mutedForeground }]}>← Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.foreground, flex: 2, opacity: distortion ? 1 : 0.4 }]} onPress={() => setStep(2)} disabled={!distortion} activeOpacity={0.85}>
                    <Text style={[s.primaryBtnText, { color: colors.background }]}>Next →</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {step === 2 && (
              <>
                <Text style={[s.stepLabel, { color: colors.foreground }]}>Step 3: Reframe it</Text>
                <Text style={[s.hint, { color: colors.mutedForeground }]}>Write a more balanced, compassionate thought.</Text>
                <TextInput
                  style={[s.bigInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  multiline placeholder="A more balanced way to look at this is..." placeholderTextColor={colors.border}
                  value={reframe} onChangeText={setReframe} textAlignVertical="top"
                />
                <TouchableOpacity style={[s.outlineBtn, { borderColor: colors.border }]} onPress={aiHelp} disabled={aiLoading} activeOpacity={0.85}>
                  {aiLoading ? <ActivityIndicator size="small" color={colors.calm} /> : <><Feather name="zap" size={15} color={colors.calm} /><Text style={[s.outlineBtnText, { color: colors.calm }]}>Help me reframe with AI</Text></>}
                </TouchableOpacity>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity style={[s.outlineBtn, { borderColor: colors.border, flex: 1 }]} onPress={() => setStep(1)}>
                    <Text style={[s.outlineBtnText, { color: colors.mutedForeground }]}>← Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.foreground, flex: 2, opacity: reframe.trim() ? 1 : 0.4 }]} onPress={save} disabled={!reframe.trim()} activeOpacity={0.85}>
                    <Text style={[s.primaryBtnText, { color: colors.background }]}>Save reframe ✓</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

export function GroundingModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const [senseIdx, setSenseIdx] = useState(0);
  const [inputs, setInputs] = useState<string[]>(Array(5).fill(""));
  const [done, setDone] = useState(false);
  const current = SENSES[senseIdx]!;
  const progress = senseIdx / SENSES.length;

  const reset = () => { setSenseIdx(0); setInputs(Array(5).fill("")); setDone(false); };
  const next = () => {
    if (senseIdx < SENSES.length - 1) setSenseIdx(senseIdx + 1);
    else setDone(true);
  };
  const back = () => { if (senseIdx > 0) setSenseIdx(senseIdx - 1); };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onShow={reset}>
      <SafeAreaView style={[s.modal, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={[s.mHeader, { borderColor: colors.border }]}>
          <Text style={[s.mTitle, { color: colors.foreground }]}>🌿 5-4-3-2-1 Grounding</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={22} color={colors.foreground} /></TouchableOpacity>
        </View>

        <View style={[s.progressOuter, { backgroundColor: colors.secondary }]}>
          <Animated.View style={[s.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.calm }]} />
        </View>

        <ScrollView contentContainerStyle={s.mContent}>
          {done ? (
            <View style={{ alignItems: "center", gap: 20, paddingVertical: 40 }}>
              <Text style={{ fontSize: 60 }}>🎉</Text>
              <Text style={[s.stepLabel, { color: colors.foreground, textAlign: "center" }]}>You're grounded</Text>
              <Text style={[s.hint, { color: colors.mutedForeground, textAlign: "center" }]}>Great work. Take a slow breath. You're here, you're safe, you're present.</Text>
              <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.foreground }]} onPress={reset} activeOpacity={0.85}>
                <Text style={[s.primaryBtnText, { color: colors.background }]}>Do it again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[s.groundingCount, { color: colors.foreground }]}>{current.count}</Text>
              <Text style={[s.groundingLabel, { color: colors.foreground }]}>things you can {current.label}</Text>
              <Text style={[s.hint, { color: colors.mutedForeground }]}>Take your time. Notice each one. Type what comes to mind.</Text>
              {Array.from({ length: current.count }).map((_, i) => (
                <TextInput
                  key={i}
                  style={[s.groundingInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  placeholder={i === 0 ? current.placeholder : `${i + 1}.`}
                  placeholderTextColor={colors.border}
                  value={inputs[senseIdx * 5 + i] ?? ""}
                  onChangeText={(v) => {
                    const next = [...inputs];
                    next[senseIdx * 5 + i] = v;
                    setInputs(next);
                  }}
                />
              ))}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                {senseIdx > 0 && (
                  <TouchableOpacity style={[s.outlineBtn, { borderColor: colors.border, flex: 1 }]} onPress={back}>
                    <Text style={[s.outlineBtnText, { color: colors.mutedForeground }]}>← Back</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.foreground, flex: 2 }]} onPress={next} activeOpacity={0.85}>
                  <Text style={[s.primaryBtnText, { color: colors.background }]}>
                    {senseIdx === SENSES.length - 1 ? "Finish ✓" : "Next →"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  modal: { flex: 1 },
  mHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  mTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  segRow: { flexDirection: "row", margin: 16, borderRadius: 10, borderWidth: 1, padding: 4, gap: 4 },
  seg: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  segText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  mContent: { padding: 20, gap: 14 },
  hint: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  bigInput: { borderWidth: 1, borderRadius: 12, padding: 14, minHeight: 100, fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 14 },
  primaryBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  outlineBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 13, borderWidth: 1 },
  outlineBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  worryRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, padding: 14, gap: 10 },
  worryText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  deleteBtn: { padding: 4 },
  emptyText: { textAlign: "center", fontSize: 14, fontFamily: "Inter_400Regular", paddingVertical: 40 },
  jarCount: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
  stepBar: { flexDirection: "row", gap: 8, justifyContent: "center", marginBottom: 8 },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  stepLabel: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  distortionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  distChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  distChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  histCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 4 },
  histLabel: { fontSize: 11, fontFamily: "Inter_500Medium", letterSpacing: 0.4, textTransform: "uppercase" },
  histText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  progressOuter: { height: 4, marginHorizontal: 20, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2 },
  groundingCount: { fontSize: 56, fontFamily: "Inter_700Bold", textAlign: "center" },
  groundingLabel: { fontSize: 20, fontFamily: "Inter_600SemiBold", textAlign: "center", marginTop: -8 },
  groundingInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
});
