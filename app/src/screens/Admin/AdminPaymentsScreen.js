import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import API from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

const AdminPaymentsScreen = () => {
  const [payments, setPayments] = useState([]);
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
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.amountText}>₹ {item.amount}</Text>
        <Badge status={item.status} text={item.status.toUpperCase()} />
      </View>
      <Text style={styles.details}>Milestone ID: {item.milestone_id}</Text>
      <Text style={styles.details}>Transaction ID: {item.razorpay_payment_id || 'Pending'}</Text>
      <Text style={styles.date}>Date: {new Date(item.createdAt).toLocaleString()}</Text>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Payment Records</Text>
      <Text style={styles.subtitle}>Global transaction history across all projects.</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          renderItem={renderItem}
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
  card: { marginBottom: SPACING.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  amountText: { ...TYPOGRAPHY.h3, color: COLORS.primary },
  details: { ...TYPOGRAPHY.body2, color: COLORS.textSecondary },
  date: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: SPACING.xs },
  empty: { ...TYPOGRAPHY.body1, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xl }
});

export default AdminPaymentsScreen;
