import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { AppointmentCard } from "../../components/AppointmentCard";
import { HomeHeader } from "../../components/HomeHeader";
import { MetricCard } from "../../components/MetricCard";
import { colors } from "../../global/colors";
import { styles } from "../../styles/home.styles";
import { appointments } from "../../utils/appointments";

function formatDate(date: Date) {
	return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(date);
}

export default function HomeScreen() {
	const [selectedDate, setSelectedDate] = useState(new Date());

	function shiftDate(days: number) {
		setSelectedDate((current) => {
			const next = new Date(current);
			next.setDate(next.getDate() + days);
			return next;
		});
	}

	function showMessage(message: string) {
		Alert.alert("BellaApp", message);
	}

	return (
		<ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
			<HomeHeader
				clinicName="Studio Bella"
				onNotificationPress={() => showMessage("Você não tem novas notificações.")}
				onProfilePress={() => showMessage("Perfil em breve.")}
			/>

			<Text style={styles.summary}>Aqui está o resumo do seu dia. Você tem <Text style={styles.summaryStrong}>3 atendimentos</Text> agendados.</Text>

			<View style={styles.metrics}>
				<MetricCard icon="calendar-outline" label="Agendamentos" value="03" />
				<MetricCard icon="checkmark-circle-outline" label="Confirmados" value="02" tone="green" />
				<MetricCard icon="time-outline" label="Pendentes" value="01" tone="neutral" />
				<MetricCard icon="trending-up-outline" label="Faturamento previsto" value="R$ 480" />
			</View>

			<View style={styles.quickActions}>
				<TouchableOpacity style={styles.quickAction} onPress={() => showMessage("Fluxo de novo agendamento em breve.")}>
					<Ionicons name="add" size={21} color={colors.white} />
					<Text style={styles.quickActionText}>Novo agendamento</Text>
				</TouchableOpacity>
				<TouchableOpacity style={[styles.quickAction, styles.quickActionAlt]} onPress={() => showMessage("Fluxo de novo cliente em breve.")}>
					<Ionicons name="person-add-outline" size={19} color={colors.primaryDark} />
					<Text style={[styles.quickActionText, styles.quickActionAltText]}>Novo cliente</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.insight}>
				<View style={styles.insightIcon}><Ionicons name="sparkles-outline" size={18} color={colors.primaryDark} /></View>
				<View style={styles.insightCopy}>
					<Text style={styles.insightTitle}>Seu dia está indo bem</Text>
					<Text style={styles.insightText}>Você já confirmou a maioria dos atendimentos de hoje.</Text>
				</View>
			</View>

			<View style={styles.sectionHeader}>
				<Text style={styles.sectionTitle}>Agenda do dia</Text>
				<TouchableOpacity onPress={() => showMessage("A agenda completa estará disponível em breve.")}><Text style={styles.link}>Ver tudo</Text></TouchableOpacity>
			</View>
			<View style={styles.dateRow}>
				<TouchableOpacity accessibilityLabel="Dia anterior" style={styles.dateButton} onPress={() => shiftDate(-1)}><Ionicons name="chevron-back" size={17} color={colors.primaryDark} /></TouchableOpacity>
				<Text style={styles.dateLabel}>{formatDate(selectedDate)}</Text>
				<TouchableOpacity accessibilityLabel="Próximo dia" style={styles.dateButton} onPress={() => shiftDate(1)}><Ionicons name="chevron-forward" size={17} color={colors.primaryDark} /></TouchableOpacity>
			</View>
			<View style={styles.panel}>
				{appointments.map((appointment) => <AppointmentCard key={`${appointment.time}-${appointment.client}`} {...appointment} onPress={() => showMessage(`Detalhes de ${appointment.client}.`)} />)}
			</View>
		</ScrollView>
	);
}
