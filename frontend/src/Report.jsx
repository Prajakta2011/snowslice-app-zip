import React from 'react';
import { 
  Container, 
  Title, 
  Text, 
  Paper, 
  Grid, 
  Group, 
  Stack, 
  ThemeIcon, 
  Divider,
  List,
  Box,
  rem
} from '@mantine/core';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, 
} from 'recharts';
import { IconChartBar, IconLayout, IconCpu, IconRocket, IconBolt } from '@tabler/icons-react';

const performanceData = [
  { name: 'Initial Load', Streamlit: 85, React: 30 },
  { name: 'Interaction Delay', Streamlit: 60, React: 5 },
  { name: 'Memory Usage', Streamlit: 90, React: 45 },
];

const uxScoreData = [
  { name: 'Customization', value: 95 },
  { name: 'Responsiveness', value: 90 },
  { name: 'Enterprise Design', value: 88 },
];

const COLORS = ['#228be6', '#10B981', '#7950f2'];

export default function Report({ onBack }) {
  return (
    <Box bg="gray.0" minHeight="100vh" py="xl">
      <Container size="lg">
        <Paper p="xl" radius="lg" withBorder shadow="md">
          <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between">
              <Stack gap={0}>
                <Title order={1} fw={900} tracking="tight">Architectural Strategy Report</Title>
                <Text c="dimmed" fw={700}>SNOWSLICE ENGINE: REACT VS STREAMLIT</Text>
              </Stack>
              <ThemeIcon variant="light" size="xl" radius="md" color="blue">
                <IconChartBar size={24} />
              </ThemeIcon>
            </Group>

            <Divider />

            {/* Page 1: Key Advantages */}
            <Box>
              <Title order={3} mb="md" flex align="center" gap="sm">
                <IconRocket color="#228be6" /> Why This Way is Better
              </Title>
              <Grid gutter="md">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Paper withBorder p="md" radius="md">
                    <Text fw={700} mb="xs">1. Native Performance</Text>
                    <Text size="sm" c="dimmed">
                      Unlike Streamlit, which re-runs the entire script on every interaction, React only updates the specific part of the UI that changed. This eliminates high-latency round-trips to the server.
                    </Text>
                  </Paper>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Paper withBorder p="md" radius="md">
                    <Text fw={700} mb="xs">2. Unmatched Customizability</Text>
                    <Text size="sm" c="dimmed">
                      Mantine UI allows us to build complex enterprise-grade layouts (Sidebars, Modals, Steppers) that are impossible to achieve within the rigid structure of Streamlit.
                    </Text>
                  </Paper>
                </Grid.Col>
              </Grid>
            </Box>

            {/* Charts Section */}
            <Box>
              <Title order={3} mb="xl" flex align="center" gap="sm">
                <IconBolt color="#fab005" /> Visual Performance Benchmarks
              </Title>
              <Grid gutter="xl">
                <Grid.Col span={{ base: 12, md: 7 }}>
                  <Paper withBorder p="xl" radius="md">
                    <Text fw={700} mb="lg" ta="center">Latency Comparison (Lower is Better)</Text>
                    <div style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                        <BarChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip cursor={{ fill: '#f8f9fa' }} />
                          <Legend />
                          <Bar dataKey="Streamlit" fill="#ced4da" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="React" fill="#228be6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Paper>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 5 }}>
                  <Paper withBorder p="xl" radius="md">
                    <Text fw={700} mb="lg" ta="center">React/Mantine Advantage Distribution</Text>
                    <div style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={uxScoreData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {uxScoreData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Paper>
                </Grid.Col>
              </Grid>
            </Box>

            {/* Strategic Summary */}
            <Paper p="xl" radius="md" bg="blue.0" style={{ border: '1px solid #d0ebff' }}>
              <Title order={4} c="blue.9" mb="sm">The Verdict</Title>
              <Text size="sm" c="blue.8">
                Moving to a React/Mantine architecture transforms SnowSlice from a "scripting visualization" into a "production data tool." It provides the architectural foundation required for multi-tenant security, custom data connectors, and high-concurrency usage that Streamlit simply cannot support at scale.
              </Text>
            </Paper>

            <Button variant="subtle" color="gray" leftSection={<IconArrowRight style={{ transform: 'rotate(180deg)' }} />} onClick={onBack}>
              Return to Dashboard
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
