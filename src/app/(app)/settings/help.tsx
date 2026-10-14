import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { env } from '@/config/env';
import { colors, fonts } from '@/constants/theme';
import { INCIDENT_TYPES, TYPE_LABELS, type IncidentType } from '@/domain/incident';
import { TYPE_ICONS } from '@/domain/type-icons';
import { Icon, type IconName } from '@/ui/icon';
import { SettingsRow, SettingsSection } from '@/ui/settings';
import { BackHeader } from '@/ui/top-bar';

const STEPS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'photo-camera', title: 'Captura', body: 'Toma la foto del daño de frente y con buena luz.' },
  { icon: 'fact-check', title: 'Revisa', body: 'Confirma la ubicación y el tipo de daño.' },
  { icon: 'send', title: 'Envía', body: 'Agrega una descripción si quieres y envía el reporte.' },
  { icon: 'track-changes', title: 'Sigue', body: 'Revisa el estado en Mis Reportes y en Notificaciones.' },
];

const TYPE_HINTS: Record<IncidentType, string> = {
  D00: 'Grieta a lo largo de la vía, en el sentido del tránsito.',
  D10: 'Grieta que cruza la vía de lado a lado.',
  D20: 'Grietas unidas en forma de malla, como escamas.',
  D40: 'Hueco en el pavimento.',
};

const FAQ: { question: string; answer: string }[] = [
  {
    question: '¿Qué pasa después de enviar un reporte?',
    answer:
      'Queda Registrado y lo recibe la municipalidad. Un operador lo revisa, le asigna una prioridad y lo pasa a En proceso cuando programa la reparación. Al terminar, el estado cambia a Resuelto.',
  },
  {
    question: '¿Por qué la app dice "Modo manual"?',
    answer:
      'El modelo de IA que reconoce el tipo de daño aún se está integrando. Mientras tanto eliges el tipo de daño tú mismo y el reporte se registra igual.',
  },
  {
    question: '¿Por qué rechazaron mi reporte?',
    answer: 'El operador indica el motivo en el detalle del reporte. Suele ser una foto poco clara, un daño duplicado o fuera de Lima Metropolitana.',
  },
  {
    question: 'Ya existe un reporte del mismo daño, ¿igual lo envío?',
    answer: 'Sí. El sistema detecta reportes parecidos a pocos metros y los agrupa para que el operador los atienda juntos.',
  },
  {
    question: '¿Necesito internet para reportar?',
    answer: 'Sí, para enviar la foto y la ubicación se necesita conexión a internet (datos móviles o Wi-Fi).',
  },
  {
    question: '¿Es una línea de emergencias?',
    answer: 'No. Si el daño pone en riesgo inmediato a personas o vehículos, comunícate con los servicios de emergencia.',
  },
];

export default function HelpScreen() {
  const [open, setOpen] = useState<number | null>(0);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={styles.safe}>
      <BackHeader title="Ayuda y soporte" step="MANUAL CÍVICO" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon name="support-agent" size={22} color={colors.white} />
          </View>
          <View style={styles.flexShrink}>
            <Text style={styles.heroTitle}>¿Cómo podemos ayudarte?</Text>
            <Text style={styles.heroText}>Aprende a reportar daños en la vía y a seguir su atención.</Text>
          </View>
        </View>

        <SettingsSection title="CÓMO REPORTAR EN 4 PASOS">
          <View style={styles.steps}>
            {STEPS.map((step, index) => (
              <View key={step.title} style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{String(index + 1).padStart(2, '0')}</Text>
                </View>
                <View style={styles.flexShrink}>
                  <View style={styles.inline}>
                    <Icon name={step.icon} size={14} color={colors.primary} />
                    <Text style={styles.stepTitle}>{step.title}</Text>
                  </View>
                  <Text style={styles.body}>{step.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </SettingsSection>

        <SettingsSection title="TIPOS DE DAÑO">
          {INCIDENT_TYPES.map((type, index) => (
            <SettingsRow key={type} first={index === 0} icon={TYPE_ICONS[type]} title={`${TYPE_LABELS[type]} · ${type}`} subtitle={TYPE_HINTS[type]} />
          ))}
        </SettingsSection>

        <SettingsSection title="PREGUNTAS FRECUENTES">
          {FAQ.map((item, index) => {
            const expanded = open === index;
            return (
              <Pressable
                key={item.question}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => setOpen(expanded ? null : index)}
                style={[styles.faq, index > 0 && styles.border]}>
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                  <Icon name={expanded ? 'expand-less' : 'expand-more'} size={20} color={colors.textMuted} />
                </View>
                {expanded ? <Text style={styles.body}>{item.answer}</Text> : null}
              </Pressable>
            );
          })}
        </SettingsSection>

        <SettingsSection title="CONTACTO">
          {env.supportEmail ? (
            <SettingsRow
              first
              icon="mail-outline"
              title="Escribir a la mesa de ayuda"
              subtitle={env.supportEmail}
              onPress={() => void Linking.openURL(`mailto:${env.supportEmail}?subject=${encodeURIComponent('Ayuda con ViaDeep')}`)}
            />
          ) : null}
          <SettingsRow
            first={!env.supportEmail}
            icon="privacy-tip"
            title="Privacidad y datos personales"
            subtitle="Qué datos usamos y tus derechos"
            onPress={() => router.push('/settings/privacy')}
          />
        </SettingsSection>

        <Text style={styles.version}>ViaDeep · versión {version}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flexShrink: { flexShrink: 1 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  content: { padding: 16, gap: 20, paddingBottom: 32 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 8, backgroundColor: colors.navy },
  heroIcon: { width: 44, height: 44, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22, color: colors.white },
  heroText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: 'rgba(255,255,255,0.75)' },
  steps: { padding: 14, gap: 14 },
  step: { flexDirection: 'row', gap: 12 },
  stepNumber: { width: 32, height: 32, borderRadius: 4, backgroundColor: colors.surfaceBlue, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontFamily: fonts.monoBold, fontSize: 12, color: colors.primary },
  stepTitle: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.textStrong },
  body: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.textSecondary },
  faq: { padding: 14, gap: 8 },
  border: { borderTopWidth: 1, borderTopColor: colors.surfaceMuted },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  faqQuestion: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.textStrong },
  version: { fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted, textAlign: 'center' },
});
