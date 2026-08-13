import { z } from 'zod';

// ============================================
// Base Types
// ============================================

export const UUIDSchema = z.string().uuid();
export type UUID = z.infer<typeof UUIDSchema>;

export const TimestampSchema = z.string().datetime();
export type Timestamp = z.infer<typeof TimestampSchema>;

export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});
export type Pagination = z.infer<typeof PaginationSchema>;

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  });

// ============================================
// Organization & Auth
// ============================================

export const OrganizationRoleSchema = z.enum(['owner', 'admin', 'analyst', 'viewer']);
export type OrganizationRole = z.infer<typeof OrganizationRoleSchema>;

export const OrganizationSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  settings: z.object({
    timezone: z.string().default('UTC'),
    currency: z.string().length(3).default('USD'),
    fiscalYearStart: z.number().int().min(1).max(12).default(1),
  }),
  ownerId: UUIDSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type Organization = z.infer<typeof OrganizationSchema>;

export const OrganizationMemberSchema = z.object({
  id: UUIDSchema,
  organizationId: UUIDSchema,
  userId: UUIDSchema,
  role: OrganizationRoleSchema,
  joinedAt: TimestampSchema,
  invitedBy: UUIDSchema.nullable(),
});
export type OrganizationMember = z.infer<typeof OrganizationMemberSchema>;

export const UserSchema = z.object({
  id: UUIDSchema,
  email: z.string().email(),
  fullName: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  createdAt: TimestampSchema,
});
export type User = z.infer<typeof UserSchema>;

export const AuthContextSchema = z.object({
  user: UserSchema,
  organization: OrganizationSchema.nullable(),
  membership: OrganizationMemberSchema.nullable(),
});
export type AuthContext = z.infer<typeof AuthContextSchema>;

// ============================================
// Business Domain
// ============================================

export const CustomerSchema = z.object({
  id: UUIDSchema,
  organizationId: UUIDSchema,
  externalId: z.string().nullable(),
  email: z.string().email().nullable(),
  fullName: z.string().nullable(),
  segment: z.string().nullable(),
  region: z.string().nullable(),
  channel: z.string().nullable(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type Customer = z.infer<typeof CustomerSchema>;

export const ProductCategorySchema = z.object({
  id: UUIDSchema,
  organizationId: UUIDSchema,
  name: z.string().min(1).max(100),
  parentId: UUIDSchema.nullable(),
  createdAt: TimestampSchema,
});
export type ProductCategory = z.infer<typeof ProductCategorySchema>;

export const ProductSchema = z.object({
  id: UUIDSchema,
  organizationId: UUIDSchema,
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().nullable(),
  categoryId: UUIDSchema,
  price: z.number().nonnegative(),
  cost: z.number().nonnegative().nullable(),
  currency: z.string().length(3).default('USD'),
  attributes: z.record(z.string(), z.unknown()).default({}),
  isActive: z.boolean().default(true),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type Product = z.infer<typeof ProductSchema>;

export const OrderSchema = z.object({
  id: UUIDSchema,
  organizationId: UUIDSchema,
  customerId: UUIDSchema,
  orderNumber: z.string().min(1).max(50),
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned']),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative().default(0),
  shipping: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
  currency: z.string().length(3).default('USD'),
  placedAt: TimestampSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type Order = z.infer<typeof OrderSchema>;

export const OrderItemSchema = z.object({
  id: UUIDSchema,
  orderId: UUIDSchema,
  productId: UUIDSchema,
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const TransactionSchema = z.object({
  id: UUIDSchema,
  organizationId: UUIDSchema,
  orderId: UUIDSchema.nullable(),
  customerId: UUIDSchema,
  type: z.enum(['sale', 'refund', 'adjustment']),
  amount: z.number(),
  currency: z.string().length(3).default('USD'),
  paymentMethod: z.string().nullable(),
  reference: z.string().nullable(),
  occurredAt: TimestampSchema,
  createdAt: TimestampSchema,
});
export type Transaction = z.infer<typeof TransactionSchema>;

// ============================================
// Analytics / KPIs
// ============================================

export const GranularitySchema = z.enum(['day', 'week', 'month', 'quarter', 'year']);
export type Granularity = z.infer<typeof GranularitySchema>;

export const DateRangeSchema = z.object({
  start: z.string().date(),
  end: z.string().date(),
});
export type DateRange = z.infer<typeof DateRangeSchema>;

export const FilterSpecSchema = z.object({
  dateRange: DateRangeSchema.optional(),
  productIds: z.array(UUIDSchema).optional(),
  categoryIds: z.array(UUIDSchema).optional(),
  regionIds: z.array(UUIDSchema).optional(),
  segmentIds: z.array(UUIDSchema).optional(),
  channelIds: z.array(UUIDSchema).optional(),
  customerIds: z.array(UUIDSchema).optional(),
});
export type FilterSpec = z.infer<typeof FilterSpecSchema>;

export const KPIMetricSchema = z.enum([
  'revenue',
  'orders',
  'customers',
  'units_sold',
  'avg_order_value',
  'repeat_customer_rate',
  'conversion_rate',
]);
export type KPIMetric = z.infer<typeof KPIMetricSchema>;

export const KPIValueSchema = z.object({
  metric: KPIMetricSchema,
  value: z.number(),
  period: z.string(),
  periodStart: z.string().date(),
  periodEnd: z.string().date(),
  changePct: z.number().nullable(),
  trend: z.enum(['up', 'down', 'flat']).nullable(),
});
export type KPIValue = z.infer<typeof KPIValueSchema>;

export const TimeSeriesPointSchema = z.object({
  timestamp: z.string().date(),
  value: z.number(),
});
export type TimeSeriesPoint = z.infer<typeof TimeSeriesPointSchema>;

export const DimensionBreakdownSchema = z.object({
  dimension: z.string(),
  dimensionValue: z.string(),
  metrics: z.record(KPIMetricSchema, z.number()),
});
export type DimensionBreakdown = z.infer<typeof DimensionBreakdownSchema>;

// ============================================
// Market Domain
// ============================================

export const TimeframeSchema = z.enum(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w']);
export type Timeframe = z.infer<typeof TimeframeSchema>;

export const SymbolSchema = z.object({
  id: UUIDSchema,
  symbol: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  exchange: z.string().min(1).max(50),
  assetClass: z.enum(['equity', 'crypto', 'forex', 'commodity', 'index']),
  currency: z.string().length(3),
  isActive: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type Symbol = z.infer<typeof SymbolSchema>;

export const OHLCVBarSchema = z.object({
  timestamp: z.number(), // Unix milliseconds
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number().nonnegative(),
});
export type OHLCVBar = z.infer<typeof OHLCVBarSchema>;

export const MarketDataQuerySchema = z.object({
  symbolId: UUIDSchema,
  timeframe: TimeframeSchema,
  start: z.number(), // Unix milliseconds
  end: z.number(),   // Unix milliseconds
});
export type MarketDataQuery = z.infer<typeof MarketDataQuerySchema>;

// ============================================
// Backtesting
// ============================================

export const StrategyTypeSchema = z.enum(['sma_cross', 'rsi_mean_reversion', 'custom']);
export type StrategyType = z.infer<typeof StrategyTypeSchema>;

export const StrategyParamSchema = z.object({
  name: z.string(),
  value: z.union([z.number(), z.string(), z.boolean()]),
  type: z.enum(['number', 'string', 'boolean']),
  description: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
});
export type StrategyParam = z.infer<typeof StrategyParamSchema>;

export const StrategySchema = z.object({
  id: UUIDSchema,
  organizationId: UUIDSchema,
  name: z.string().min(1).max(100),
  description: z.string().nullable(),
  type: StrategyTypeSchema,
  parameters: z.array(StrategyParamSchema),
  symbolId: UUIDSchema,
  timeframe: TimeframeSchema,
  createdBy: UUIDSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type Strategy = z.infer<typeof StrategySchema>;

export const BacktestRunSchema = z.object({
  id: UUIDSchema,
  organizationId: UUIDSchema,
  strategyId: UUIDSchema,
  name: z.string().min(1).max(100),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
  startDate: z.number(), // Unix milliseconds
  endDate: z.number(),   // Unix milliseconds
  initialCapital: z.number().positive(),
  commissionBps: z.number().nonnegative().default(10),
  slippageBps: z.number().nonnegative().default(5),
  parameters: z.record(z.string(), z.unknown()).default({}),
  startedAt: TimestampSchema.nullable(),
  completedAt: TimestampSchema.nullable(),
  error: z.string().nullable(),
  createdAt: TimestampSchema,
});
export type BacktestRun = z.infer<typeof BacktestRunSchema>;

export const BacktestMetricsSchema = z.object({
  totalReturn: z.number(),
  annualizedReturn: z.number(),
  sharpeRatio: z.number().nullable(),
  sortinoRatio: z.number().nullable(),
  maxDrawdown: z.number(),
  maxDrawdownDuration: z.number().nullable(), // days
  winRate: z.number(),
  profitFactor: z.number().nullable(),
  totalTrades: z.number().int().nonnegative(),
  winningTrades: z.number().int().nonnegative(),
  losingTrades: z.number().int().nonnegative(),
  avgWin: z.number().nullable(),
  avgLoss: z.number().nullable(),
  avgHoldDays: z.number().nullable(),
  exposure: z.number(), // 0-1
  calmarRatio: z.number().nullable(),
});
export type BacktestMetrics = z.infer<typeof BacktestMetricsSchema>;

export const EquityPointSchema = z.object({
  timestamp: z.number(), // Unix milliseconds
  equity: z.number(),
  cash: z.number(),
  positions: z.number(),
  drawdown: z.number(),
});
export type EquityPoint = z.infer<typeof EquityPointSchema>;

export const TradeSchema = z.object({
  id: UUIDSchema,
  runId: UUIDSchema,
  entryTime: z.number(),
  exitTime: z.number().nullable(),
  symbol: z.string(),
  side: z.enum(['long', 'short']),
  entryPrice: z.number(),
  exitPrice: z.number().nullable(),
  quantity: z.number(),
  commission: z.number(),
  slippage: z.number(),
  pnl: z.number().nullable(),
  pnlPct: z.number().nullable(),
  status: z.enum(['open', 'closed']),
});
export type Trade = z.infer<typeof TradeSchema>;

export const BacktestResultSchema = z.object({
  run: BacktestRunSchema,
  metrics: BacktestMetricsSchema,
  equityCurve: z.array(EquityPointSchema),
  trades: z.array(TradeSchema),
});
export type BacktestResult = z.infer<typeof BacktestResultSchema>;

// ============================================
// Retail Intelligence
// ============================================

export const ProductRecommendationSchema = z.object({
  product: ProductSchema,
  score: z.number().min(0).max(1),
  reasons: z.array(z.string()),
  budgetFit: z.enum(['under', 'at', 'over']).nullable(),
});
export type ProductRecommendation = z.infer<typeof ProductRecommendationSchema>;

export const RecommendationRequestSchema = z.object({
  budget: z.number().positive().optional(),
  categoryId: UUIDSchema.optional(),
  context: z.string().optional(),
  limit: z.number().int().positive().max(20).default(5),
});
export type RecommendationRequest = z.infer<typeof RecommendationRequestSchema>;

// ============================================
// AI Copilot
// ============================================

export const ToolNameSchema = z.enum([
  'query_kpis',
  'analyze_trend',
  'get_product_performance',
  'recommend_products',
  'explain_backtest',
]);
export type ToolName = z.infer<typeof ToolNameSchema>;

export const ToolCallSchema = z.object({
  id: UUIDSchema,
  name: ToolNameSchema,
  parameters: z.record(z.string(), z.unknown()),
  result: z.unknown().nullable(),
  error: z.string().nullable(),
  startedAt: TimestampSchema,
  completedAt: TimestampSchema.nullable(),
  durationMs: z.number().int().nonnegative().nullable(),
});
export type ToolCall = z.infer<typeof ToolCallSchema>;

export const AIMessageSchema = z.object({
  id: UUIDSchema,
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  content: z.string(),
  toolCalls: z.array(ToolCallSchema).optional(),
  toolCallId: UUIDSchema.nullable(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: TimestampSchema,
});
export type AIMessage = z.infer<typeof AIMessageSchema>;

export const AIContextSchema = z.object({
  module: z.enum(['command_center', 'datamart', 'analytics', 'strategy_lab', 'retail', 'general']),
  organizationId: UUIDSchema,
  userId: UUIDSchema,
  currentEntityId: UUIDSchema.nullable(), // e.g., current backtest run, product, etc.
  recentMessages: z.array(AIMessageSchema).max(10),
});
export type AIContext = z.infer<typeof AIContextSchema>;

export const ToolDefinitionSchema = z.object({
  name: ToolNameSchema,
  description: z.string(),
  parameters: z.record(z.string(), z.unknown()), // JSON Schema
  returns: z.record(z.string(), z.unknown()),   // JSON Schema
  requiresAuth: z.boolean().default(true),
  moduleContext: z.array(z.string()).optional(), // modules where tool is available
});
export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;

// ============================================
// Alerts & Notifications
// ============================================

export const AlertSeveritySchema = z.enum(['info', 'warning', 'critical']);
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;

export const AlertSchema = z.object({
  id: UUIDSchema,
  organizationId: UUIDSchema,
  type: z.string(),
  severity: AlertSeveritySchema,
  title: z.string(),
  message: z.string(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  isRead: z.boolean().default(false),
  isDismissed: z.boolean().default(false),
  createdAt: TimestampSchema,
  readAt: TimestampSchema.nullable(),
});
export type Alert = z.infer<typeof AlertSchema>;

// ============================================
// DataMart
// ============================================

export const DataSourceSchema = z.object({
  id: UUIDSchema,
  organizationId: UUIDSchema,
  name: z.string().min(1).max(100),
  type: z.enum(['csv', 'excel', 'api', 'database']),
  config: z.record(z.string(), z.unknown()),
  schedule: z.string().nullable(), // cron expression
  lastSyncAt: TimestampSchema.nullable(),
  status: z.enum(['active', 'paused', 'error']),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type DataSource = z.infer<typeof DataSourceSchema>;

export const IngestionJobSchema = z.object({
  id: UUIDSchema,
  organizationId: UUIDSchema,
  sourceId: UUIDSchema,
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  rowsProcessed: z.number().int().nonnegative().default(0),
  rowsValid: z.number().int().nonnegative().default(0),
  rowsInvalid: z.number().int().nonnegative().default(0),
  errors: z.array(z.string()).default([]),
  startedAt: TimestampSchema.nullable(),
  completedAt: TimestampSchema.nullable(),
  createdAt: TimestampSchema,
});
export type IngestionJob = z.infer<typeof IngestionJobSchema>;

export const SchemaMappingSchema = z.object({
  sourceField: z.string(),
  targetField: z.string(),
  transform: z.enum(['none', 'uppercase', 'lowercase', 'trim', 'date_parse', 'number_parse', 'boolean_parse']).default('none'),
  transformConfig: z.record(z.string(), z.unknown()).default({}),
  isRequired: z.boolean().default(false),
  defaultValue: z.unknown().nullable(),
});
export type SchemaMapping = z.infer<typeof SchemaMappingSchema>;