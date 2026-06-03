import {
	Building2,
	CalendarDays,
	Clock3,
	LayoutDashboard,
	ShieldCheck,
	Sparkles,
	Star,
	TrendingUp,
	Users,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import LandingFeatures from "../../components/landing/LandingFeatures";
import LandingFinalCta from "../../components/landing/LandingFinalCta";
import LandingHeader from "../../components/landing/LandingHeader";
import LandingHero from "../../components/landing/LandingHero";
import LandingWorkflow from "../../components/landing/LandingWorkflow";
import "../../styles/landing/landing-page.css";

const featureCards = [
	{
		icon: CalendarDays,
		title: "Agenda visual, viva e legível",
		description:
			"Acompanhe a semana, altere status e reorganize o dia sem perder contexto de horário, sala e profissional.",
		bullets: ["Blocos claros por período", "Mudanças rápidas de status"],
	},
	{
		icon: Users,
		title: "Clientes com histórico útil",
		description:
			"Veja observações, próxima visita, total investido e sinais do relacionamento sem abrir várias telas.",
		bullets: ["Contexto em um só lugar", "Retenção mais consciente"],
	},
	{
		icon: Building2,
		title: "Salas e operação sob controle",
		description:
			"Distribua melhor os atendimentos e organize o espaço físico da clínica com menos improviso.",
		bullets: ["Visão de uso mensal", "Fluxo mais previsível"],
	},
	{
		icon: LayoutDashboard,
		title: "Painel que resume o dia",
		description:
			"Tenha em segundos um retrato do movimento: confirmados, pendências, cancelados e serviços em destaque.",
		bullets: ["Leitura rápida da operação", "Decisão mais imediata"],
	},
	{
		icon: ShieldCheck,
		title: "Back-end sólido por trás da rotina",
		description:
			"A operação do sistema foi estruturada com validação, regras claras e cobertura de testes para sustentar o uso real.",
		bullets: ["Fluxos críticos cobertos", "Comportamento mais confiável"],
	},
	{
		icon: Sparkles,
		title: "Onboarding leve para começar direito",
		description:
			"A configuração inicial guia a clínica para entrar em operação rápido, sem uma implantação pesada.",
		bullets: ["Setup enxuto", "Primeiros cadastros organizados"],
	},
];

const audienceCards = [
	{
		icon: Building2,
		title: "Clínicas autorais",
		description: "Para quem quer profissionalizar a operação sem perder delicadeza no atendimento.",
	},
	{
		icon: Users,
		title: "Equipes em crescimento",
		description: "Ideal para negócios que começaram simples e agora precisam de um fluxo mais coordenado.",
	},
	{
		icon: Sparkles,
		title: "Serviços premium",
		description: "Uma experiência mais organizada transmite mais valor antes mesmo do atendimento começar.",
	},
];

const workflowSteps = [
	{
		icon: Sparkles,
		step: "01",
		title: "Configure o essencial",
		description: "Cadastre serviços, equipe, salas e regras básicas do negócio sem setup complexo.",
	},
	{
		icon: CalendarDays,
		step: "02",
		title: "Toque a agenda com clareza",
		description: "Gerencie confirmações, reagendamentos e atendimentos com menos ruído operacional.",
	},
	{
		icon: TrendingUp,
		step: "03",
		title: "Leia o ritmo da clínica",
		description: "Use o painel e os indicadores para ajustar o dia, a equipe e os serviços mais fortes.",
	},
];

const workflowOutcomes = [
	{
		icon: Clock3,
		title: "Menos fricção no dia a dia",
		description: "Menos troca entre planilhas, blocos de nota e mensagens dispersas.",
	},
	{
		icon: Star,
		title: "Percepção mais premium",
		description: "Organização também é parte da experiência que a cliente sente.",
	},
	{
		icon: ShieldCheck,
		title: "Operação mais consistente",
		description: "Agenda, clientes, serviços, profissionais e salas falando a mesma língua.",
	},
];

function resolveLandingDestination(isAuthenticated, onboarding, onboardingLoading) {
	if (!isAuthenticated) {
		return {
			primaryTo: "/login?mode=register",
			primaryLabel: "Quero começar",
			secondaryTo: "/login",
			secondaryLabel: "Entrar no sistema",
			ctaPrimaryLabel: "Criar minha conta",
			ctaSecondaryLabel: "Entrar agora",
		};
	}

	const destination = onboardingLoading ? "/dashboard" : onboarding?.completed === true ? "/dashboard" : "/onboarding";

	return {
		primaryTo: destination,
		primaryLabel: "Continuar no sistema",
		secondaryTo: "/dashboard",
		secondaryLabel: "Abrir painel",
		ctaPrimaryLabel: "Ir para o sistema",
		ctaSecondaryLabel: "Abrir dashboard",
	};
}

export default function LandingPage() {
	const { isAuthenticated, onboarding, onboardingLoading } = useAuth();
	const actions = resolveLandingDestination(isAuthenticated, onboarding, onboardingLoading);

	return (
		<div className="landing-page">
			<div className="landing-glow landing-glow-left" aria-hidden="true" />
			<div className="landing-glow landing-glow-right" aria-hidden="true" />

			<LandingHeader actions={actions} isAuthenticated={isAuthenticated} />

			<main className="landing-main">
				<LandingHero actions={actions} isAuthenticated={isAuthenticated} />

				<section className="landing-section landing-shell" id="para-quem-e">
					<div className="landing-section-heading">
						<span className="landing-kicker">Pensado para a rotina real</span>
						<h2>Um sistema feito para estética, bem-estar e operação com mais presença.</h2>
						<p>
							O Bella App nasce para unir organização, visual agradável e controle prático em uma rotina que costuma
							ficar espalhada demais.
						</p>
					</div>

					<div className="landing-audience-grid">
						{audienceCards.map(({ icon: Icon, title, description }) => (
							<article className="landing-audience-card" key={title}>
								<span className="landing-icon-chip">
									<Icon size={18} strokeWidth={2.2} />
								</span>
								<h3>{title}</h3>
								<p>{description}</p>
							</article>
						))}
					</div>
				</section>

				<LandingFeatures features={featureCards} />
				<LandingWorkflow steps={workflowSteps} outcomes={workflowOutcomes} />
				<LandingFinalCta actions={actions} isAuthenticated={isAuthenticated} />
			</main>
		</div>
	);
}
