import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ContributionModal } from '@/components/goal/contribution-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DateTimeField } from '@/components/ui/date-time-field';
import { OptionChips } from '@/components/ui/option-chips';
import { Screen } from '@/components/ui/screen';
import { AppTextInput, FormField } from '@/components/ui/text-input';
import { ThemedText } from '@/components/ui/themed-text';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useAccounts } from '@/hooks/use-accounts';
import { useGoals } from '@/hooks/use-goals';
import {
  addGoalContribution,
  getGoal,
  getGoalContributions,
  removeGoalContribution,
} from '@/services/goals';
import type { ContributionWithDate, GoalWithProgress } from '@/types/models';
import { formatMoney, parseAmount } from '@/utils/format';

const DEADLINE_OPTIONS: { value: 'none' | 'date'; label: string; icon: 'close-circle' | 'calendar' }[] = [
  { value: 'none', label: 'Sin límite', icon: 'close-circle' },
  { value: 'date', label: 'Con fecha', icon: 'calendar' },
];

function contributionDateLabel(contribution: ContributionWithDate): string {
  if (contribution.occurred_at) {
    return format(new Date(contribution.occurred_at), "d MMM yyyy", { locale: es });
  }
  return format(new Date(contribution.created_at), "d MMM yyyy", { locale: es });
}

export default function GoalFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = id ? Number(id) : null;
  const isEditing = editingId !== null;

  const db = useSQLiteContext();
  const { accounts } = useAccounts();
  const { create, update, remove } = useGoals();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [goal, setGoal] = useState<GoalWithProgress | null>(null);
  const [contributions, setContributions] = useState<ContributionWithDate[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!isEditing);
  const [contributionModalVisible, setContributionModalVisible] = useState(false);
  const [contributionSaving, setContributionSaving] = useState(false);

  const reload = async () => {
    if (editingId === null) {
      return;
    }
    const [goalResult, contributionsResult] = await Promise.all([
      getGoal(db, editingId),
      getGoalContributions(db, editingId),
    ]);
    setGoal(goalResult);
    setContributions(contributionsResult);
  };

  useEffect(() => {
    if (editingId === null) {
      return;
    }
    let cancelled = false;
    Promise.all([getGoal(db, editingId), getGoalContributions(db, editingId)]).then(
      ([goalResult, contributionsResult]) => {
        if (cancelled || !goalResult) {
          return;
        }
        setGoal(goalResult);
        setContributions(contributionsResult);
        setName(goalResult.name);
        setTargetAmount(String(goalResult.target_amount));
        setDescription(goalResult.description ?? '');
        setDeadline(goalResult.deadline ? parseISO(goalResult.deadline) : null);
        setLoaded(true);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [editingId, db]);

  const validate = (): string | null => {
    if (!name.trim()) {
      return 'Escribe un nombre para la meta.';
    }
    const target = parseAmount(targetAmount);
    if (target === null || target <= 0) {
      return 'Ingresa un monto objetivo mayor a cero.';
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      Alert.alert('Datos incompletos', validationError);
      return;
    }

    const input = {
      name,
      description: description.trim() ? description : null,
      target_amount: parseAmount(targetAmount)!,
      deadline: deadline ? format(deadline, 'yyyy-MM-dd') : null,
    };

    try {
      setSaving(true);
      if (editingId !== null) {
        await update(editingId, input);
      } else {
        await create(input);
      }
      router.back();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar la meta.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (editingId === null) {
      return;
    }
    Alert.alert(
      'Eliminar meta',
      'Se borrarán sus aportes. Los movimientos vinculados se mantendrán en tu historial.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(editingId);
              router.back();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la meta.');
            }
          },
        },
      ]
    );
  };

  const handleAddContribution = async (input: {
    amount: number;
    account_id: number;
    occurred_at: string;
  }) => {
    if (editingId === null || !goal) {
      return;
    }
    try {
      setContributionSaving(true);
      await addGoalContribution(db, editingId, goal.name, input);
      await reload();
      setContributionModalVisible(false);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo registrar el aporte.');
    } finally {
      setContributionSaving(false);
    }
  };

  const handleRemoveContribution = (contribution: ContributionWithDate) => {
    Alert.alert(
      'Eliminar aporte',
      contribution.movement_id !== null
        ? 'También se eliminará el movimiento vinculado de tu historial.'
        : 'El aporte se quitará del progreso de la meta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeGoalContribution(db, contribution.id);
              await reload();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el aporte.');
            }
          },
        },
      ]
    );
  };

  if (!loaded) {
    return (
      <Screen>
        <Stack.Screen options={{ title: isEditing ? 'Editar meta' : 'Nueva meta' }} />
      </Screen>
    );
  }

  const daysLeft = goal?.deadline ? differenceInCalendarDays(parseISO(goal.deadline), new Date()) : null;

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: isEditing ? 'Editar meta' : 'Nueva meta' }} />

      <View style={styles.form}>
        <Card style={styles.card}>
          <AppTextInput
            label="Nombre"
            placeholder="Ej: Viaje a Cancún, Fondo de emergencia"
            value={name}
            onChangeText={setName}
            maxLength={60}
          />
          <AppTextInput
            label="Monto objetivo"
            placeholder="0.00"
            value={targetAmount}
            onChangeText={setTargetAmount}
            keyboardType="decimal-pad"
          />
          <FormField label="Fecha límite (opcional)">
            <OptionChips
              options={DEADLINE_OPTIONS}
              value={deadline ? 'date' : 'none'}
              onChange={(value) =>
                setDeadline(value === 'none' ? null : (deadline ?? new Date()))
              }
            />
            {deadline ? <DateTimeField value={deadline} onChange={setDeadline} /> : null}
          </FormField>
          <AppTextInput
            label="Descripción (opcional)"
            placeholder="Para qué es esta meta"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
            style={styles.descriptionInput}
          />
        </Card>

        {goal ? (
          <Card style={styles.card}>
            <View style={styles.progressHeader}>
              <View style={styles.progressColumn}>
                <ThemedText variant="small" color="muted">
                  Ahorrado
                </ThemedText>
                <ThemedText
                  variant="subtitle"
                  color={goal.progress >= 1 ? 'income' : 'savings'}
                >
                  {formatMoney(goal.saved)} de {formatMoney(goal.target_amount)}
                </ThemedText>
                {daysLeft !== null ? (
                  <ThemedText variant="tiny" color="faint">
                    {daysLeft >= 0 ? `Faltan ${daysLeft} días` : `Vencida hace ${Math.abs(daysLeft)} días`}
                  </ThemedText>
                ) : null}
              </View>
              <ThemedText variant="title" color={goal.progress >= 1 ? 'income' : 'default'}>
                {Math.round(goal.progress * 100)}%
              </ThemedText>
            </View>

            <View style={styles.sectionHeader}>
              <ThemedText variant="subtitle">Aportes</ThemedText>
              <Button
                label="Aportar"
                onPress={() => setContributionModalVisible(true)}
                style={styles.contributeButton}
              />
            </View>
            {contributions.length === 0 ? (
              <ThemedText variant="small" color="faint">
                Aún no hay aportes en esta meta.
              </ThemedText>
            ) : (
              contributions.map((contribution) => (
                <View key={contribution.id} style={styles.contributionRow}>
                  <ThemedText variant="small" style={styles.contributionDate}>
                    {contributionDateLabel(contribution)}
                  </ThemedText>
                  <ThemedText variant="body" color="savings" style={styles.contributionAmount}>
                    {formatMoney(contribution.amount)}
                  </ThemedText>
                  <Pressable
                    onPress={() => handleRemoveContribution(contribution)}
                    hitSlop={8}
                    style={({ pressed }) => pressed && styles.pressed}
                  >
                    <Ionicons name="trash-outline" size={20} color={Colors.expense} />
                  </Pressable>
                </View>
              ))
            )}
          </Card>
        ) : null}

        <Button
          label={isEditing ? 'Guardar cambios' : 'Crear meta'}
          onPress={handleSave}
          loading={saving}
        />

        {isEditing ? <Button label="Eliminar meta" variant="danger" onPress={handleDelete} /> : null}
      </View>

      {goal ? (
        <ContributionModal
          visible={contributionModalVisible}
          goalName={goal.name}
          accounts={accounts ?? []}
          saving={contributionSaving}
          onClose={() => setContributionModalVisible(false)}
          onSubmit={handleAddContribution}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.lg,
  },
  card: {
    gap: Spacing.lg,
  },
  descriptionInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressColumn: {
    gap: Spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  contributeButton: {
    minHeight: 40,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  contributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  contributionDate: {
    flex: 1,
    color: Colors.textMuted,
  },
  contributionAmount: {
    fontWeight: '600',
    fontSize: Typography.body,
  },
  pressed: {
    opacity: 0.6,
  },
});
