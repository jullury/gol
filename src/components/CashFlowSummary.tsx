import { View, Text, StyleSheet } from 'react-native';

interface CashFlowSummaryProps {
  totalCashIn: number;
  totalCashOut: number;
  netCashFlow: number;
  passengerCount: number;
  activePassengerCount: number;
}

export default function CashFlowSummary({
  totalCashIn,
  totalCashOut,
  netCashFlow,
  passengerCount,
  activePassengerCount,
}: CashFlowSummaryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cash Flow</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Passengers</Text>
        <Text style={styles.value}>{passengerCount}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>On Board</Text>
        <Text style={styles.value}>{activePassengerCount}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.label}>Money In</Text>
        <Text style={styles.cashIn}>{totalCashIn.toLocaleString()} Ar</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Money Out</Text>
        <Text style={styles.cashOut}>{totalCashOut.toLocaleString()} Ar</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.netLabel}>Net Cash Flow</Text>
        <Text style={[styles.netValue, netCashFlow >= 0 ? styles.positive : styles.negative]}>
          {netCashFlow >= 0 ? '+' : ''}
          {netCashFlow.toLocaleString()} Ar
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  label: {
    fontSize: 15,
    color: '#6b7280',
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 4,
  },
  cashIn: {
    fontSize: 15,
    fontWeight: '600',
    color: '#16a34a',
  },
  cashOut: {
    fontSize: 15,
    fontWeight: '600',
    color: '#dc2626',
  },
  netLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  netValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  positive: {
    color: '#16a34a',
  },
  negative: {
    color: '#dc2626',
  },
});
