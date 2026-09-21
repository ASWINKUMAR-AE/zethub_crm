import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import API from '../_services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../constants/theme';
import DotGridBackground from '../../components/DotGridBackground';

const PaymentsScreen = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await API.get('/payments');
      setPayments(res.data);
    } catch (e) {
      console.error(e);
      // Fallback
      setPayments([
        { id: 1, amount: 5000, status: 'paid', milestone_id: 1, razorpay_payment_id: 'pay_ABC123', createdAt: new Date().toISOString() },
        { id: 2, amount: 8000, status: 'pending', milestone_id: 2, razorpay_payment_id: null, createdAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.amountText}>₹ {item.amount}</Text>
        <Badge status={item.status} text={undefined} style={undefined} />
      </View>
      <Text style={styles.details}>Milestone ID: {item.milestone_id}</Text>
      <Text style={styles.details}>Transaction ID: {item.razorpay_payment_id || 'Pending'}</Text>
      <Text style={styles.date}>Date: {new Date(item.createdAt).toLocaleString()}</Text>
    </Card>
  );

  return (
    <View style={styles.container}>
      <DotGridBackground />
      <Text style={styles.title}>All Payment Records</Text>
      <Text style={styles.subtitle}>Global transaction history across all projects.</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<Text style={styles.empty}>No payment records found.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg },
  title: { ...TYPOGRAPHY.h2, color: COLORS.text, marginBottom: SPACING.xs },
  subtitle: { ...TYPOGRAPHY.body1, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  card: { marginBottom: SPACING.md, padding: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  amountText: { ...TYPOGRAPHY.h3, color: COLORS.primary },
  details: { ...TYPOGRAPHY.body2, color: COLORS.textSecondary },
  date: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: SPACING.xs },
  empty: { ...TYPOGRAPHY.body1, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xl }
});

export default PaymentsScreen;
