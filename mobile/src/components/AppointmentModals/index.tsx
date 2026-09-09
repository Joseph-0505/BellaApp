import React, { useEffect, useState, type PropsWithChildren } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../global/colors";
import { Button } from "../Button";
import { RecordActions } from "../RecordActions";
import { Input } from "../Input";
import { styles } from "../NewServiceModal/styles";
import { type Appointment, type NewAppointment, statusLabels } from "../../services/appointments";
import { formatRequestError } from "../../utils/request-errors";

export type Choice = { id: string; name: string };
export interface Catalogs { clients: Choice[]; services: Choice[]; professionals: Choice[] }

function Shell({ visible, title, onClose, children }: PropsWithChildren<{ visible: boolean; title: string; onClose: () => void }>) {
  const insets = useSafeAreaInsets();
  return <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
    <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fechar modal" />
      <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20), marginTop: insets.top + 16 }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <View style={styles.headerCopy}><Text style={styles.eyebrow}>Agenda</Text><Text style={styles.title}>{title}</Text></View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Fechar" style={styles.closeButton} onPress={onClose}><Ionicons name="close" size={23} color={colors.primaryDark} /></TouchableOpacity>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.form, { gap: 14, paddingBottom: 20 }]}>{children}</ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

function Select({ label, items, value, onChange }: { label: string; items: Choice[]; value: string; onChange: (value: string) => void }) {
  return <View style={{ gap: 8 }}>
    <Text style={{ color: colors.text, fontWeight: "600" }}>{label}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
      {items.map(item => <TouchableOpacity key={item.id} accessibilityRole="button" accessibilityState={{ selected: value === item.id }} onPress={() => onChange(item.id)} style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: value === item.id ? colors.primaryDark : colors.border, backgroundColor: value === item.id ? colors.primaryLight : colors.surface }}><Text style={{ color: colors.text }}>{item.name}</Text></TouchableOpacity>)}
    </ScrollView>
    {!items.length ? <Text style={{ color: colors.textSecondary }}>Nenhum cadastro disponível.</Text> : null}
  </View>;
}

export function NewAppointmentModal({ visible, date, catalogs, onClose, onSubmit, appointment }: { visible: boolean; date: Date; catalogs: Catalogs; onClose: () => void; onSubmit: (value: NewAppointment) => Promise<void>; appointment?: Appointment | null }) {
  const [clientId, setClient] = useState("");
  const [serviceId, setService] = useState("");
  const [professionalId, setProfessional] = useState("");
  const [day, setDay] = useState("");
  const [time, setTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("SCHEDULED");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!visible) return;
    const initialDate = appointment ? new Date(appointment.scheduledAt) : date;
    setClient(appointment?.clientId || ""); setService(appointment?.serviceId || ""); setProfessional(appointment?.professionalId || ""); setNotes(appointment?.notes || ""); setError(""); setStatus(appointment?.status || "SCHEDULED");
    setDay(`${String(initialDate.getDate()).padStart(2, "0")}/${String(initialDate.getMonth() + 1).padStart(2, "0")}/${initialDate.getFullYear()}`);
    setTime(appointment ? initialDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "09:00");
  }, [visible, date, appointment]);
  async function save() {
    if (saving) return;
    if (!clientId || !serviceId || !professionalId) { setError("Selecione cliente, serviço e profissional."); return; }
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(day);
    if (!match || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) { setError("Informe data (DD/MM/AAAA) e horário (HH:MM) válidos."); return; }
    const [, d, m, y] = match;
    const scheduled = new Date(Number(y), Number(m) - 1, Number(d), Number(time.slice(0, 2)), Number(time.slice(3)));
    if (scheduled.getDate() !== Number(d) || scheduled.getMonth() !== Number(m) - 1 || scheduled.getFullYear() !== Number(y)) { setError("Data inválida."); return; }
    setSaving(true); setError("");
    try {
      await onSubmit({ clientId, serviceId, professionalId, roomId: appointment?.roomId || undefined, scheduledAt: scheduled.toISOString(), status: status as NewAppointment["status"], notes: notes.trim() || undefined });
      onClose();
    } catch (e) { setError(formatRequestError(e, "Não foi possível salvar o agendamento.")); }
    finally { setSaving(false); }
  }
  return <Shell visible={visible} title={appointment ? "Editar agendamento" : "Novo agendamento"} onClose={() => { if (!saving) onClose(); }}>
    <Select label="Cliente" items={catalogs.clients} value={clientId} onChange={setClient} />
    <Select label="Serviço" items={catalogs.services} value={serviceId} onChange={setService} />
    <Select label="Profissional" items={catalogs.professionals} value={professionalId} onChange={setProfessional} />
    <Input label="Data" icon="calendar-outline" placeholder="DD/MM/AAAA" value={day} onChangeText={setDay} maxLength={10} />
    <Input label="Horário" icon="time-outline" placeholder="HH:MM" value={time} onChangeText={setTime} maxLength={5} />
    <Select label="Status" items={[{ id: "SCHEDULED", name: "Agendado" }, { id: "CONFIRMED", name: "Confirmado" }, ...(appointment ? [{ id: "CANCELED", name: "Cancelado" }] : [])]} value={status} onChange={setStatus} />
    <Input label="Observações" icon="document-text-outline" multiline maxLength={500} value={notes} onChangeText={setNotes} />
    {error ? <Text accessibilityRole="alert" style={styles.requestError}>{error}</Text> : null}
    <Button title="Salvar agendamento" loading={saving} disabled={saving} onPress={() => void save()} />
  </Shell>;
}

export function AppointmentDetailsModal({ appointment, catalogs, onClose, onEdit, onDelete }: { appointment: Appointment | null; catalogs: Catalogs; onClose: () => void; onEdit?: () => void; onDelete?: () => Promise<void> }) {
  const name = (items: Choice[], id: string | null) => items.find(item => item.id === id)?.name || "Não disponível";
  return <Shell visible={!!appointment} title="Detalhes do agendamento" onClose={onClose}>
    {appointment ? <>
      {[
        ["Serviço", name(catalogs.services, appointment.serviceId)],
        ["Cliente", name(catalogs.clients, appointment.clientId)],
        ["Profissional", name(catalogs.professionals, appointment.professionalId)],
        ["Data e horário", new Date(appointment.scheduledAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })],
        ["Status", statusLabels[appointment.status] || appointment.status],
        ["Observações", appointment.notes || "Sem observações"],
      ].map(([label, value]) => <View key={label} style={{ padding: 14, borderRadius: 12, backgroundColor: colors.surface, gap: 5 }}><Text style={{ color: colors.primaryDark, fontSize: 12 }}>{label}</Text><Text style={{ color: colors.text, fontSize: 16 }}>{value}</Text></View>)}
      {onEdit && onDelete ? <RecordActions key={appointment.id} name="agendamento" onEdit={onEdit} onDelete={onDelete} /> : null}
      <Button title="Fechar" onPress={onClose} />
    </> : null}
  </Shell>;
}
