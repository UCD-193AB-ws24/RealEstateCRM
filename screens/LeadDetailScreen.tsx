import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "react-native-paper";

export default function LeadDetailScreen({ route }) {
  const { lead } = route.params;

  return (
    <View style={styles.container}>
      <Card>
        <Card.Content>
          <Text style={styles.address}>{lead.address}</Text>
          <Text>City: {lead.city}</Text>
          <Text>State: {lead.state}</Text>
          <Text>Zip: {lead.zip}</Text>
          <Text>Owner: {lead.owner}</Text>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  address: { fontSize: 20, fontWeight: "bold" },
});
