import { ReactNode, ComponentType, HTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

/**
 * 基础组件Props类型
 */
export interface BaseComponentProps {
  /** 组件类名 */
  className?: string;
  /** 子元素 */
  children?: ReactNode;
  /** 数据测试标识 */
  'data-testid'?: string;
}

/**
 * 按钮组件Props类型
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, BaseComponentProps {
  /** 按钮变体 */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger';
  /** 按钮尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否为加载状态 */
  loading?: boolean;
  /** 加载文本 */
  loadingText?: string;
  /** 图标 */
  icon?: ReactNode;
  /** 图标位置 */
  iconPosition?: 'left' | 'right';
  /** 是否全宽 */
  fullWidth?: boolean;
}

/**
 * 输入框组件Props类型
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, BaseComponentProps {
  /** 标签 */
  label?: string;
  /** 错误信息 */
  error?: string;
  /** 帮助文本 */
  helperText?: string;
  /** 左侧图标 */
  leftIcon?: ReactNode;
  /** 右侧图标 */
  rightIcon?: ReactNode;
  /** 是否必填 */
  required?: boolean;
}

/**
 * 卡片组件Props类型
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement>, BaseComponentProps {
  /** 卡片变体 */
  variant?: 'default' | 'outline' | 'shadow';
  /** 是否可悬停 */
  hoverable?: boolean;
  /** 头部内容 */
  header?: ReactNode;
  /** 底部内容 */
  footer?: ReactNode;
  /** 内边距尺寸 */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * 模态框组件Props类型
 */
export interface ModalProps extends BaseComponentProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 标题 */
  title?: string;
  /** 是否可通过点击遮罩关闭 */
  closeOnOverlayClick?: boolean;
  /** 是否可通过ESC键关闭 */
  closeOnEscape?: boolean;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** 是否显示关闭按钮 */
  showCloseButton?: boolean;
}

/**
 * 下拉选择组件Props类型
 */
export interface SelectProps<T = any> extends BaseComponentProps {
  /** 选项列表 */
  options: SelectOption<T>[];
  /** 当前值 */
  value?: T;
  /** 变化回调 */
  onChange: (value: T) => void;
  /** 占位符 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否可搜索 */
  searchable?: boolean;
  /** 是否多选 */
  multiple?: boolean;
  /** 标签 */
  label?: string;
  /** 错误信息 */
  error?: string;
  /** 是否必填 */
  required?: boolean;
}

/**
 * 选择选项类型
 */
export interface SelectOption<T = any> {
  /** 选项值 */
  value: T;
  /** 显示标签 */
  label: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 图标 */
  icon?: ReactNode;
  /** 描述 */
  description?: string;
}

/**
 * 表格列定义类型
 */
export interface TableColumn<T = any> {
  /** 列键 */
  key: keyof T | string;
  /** 列标题 */
  title: string;
  /** 渲染函数 */
  render?: (value: any, record: T, index: number) => ReactNode;
  /** 是否可排序 */
  sortable?: boolean;
  /** 列宽 */
  width?: number | string;
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 是否固定 */
  fixed?: 'left' | 'right';
  /** 筛选器 */
  filters?: TableFilter[];
  /** 筛选函数 */
  onFilter?: (value: any, record: T) => boolean;
}

/**
 * 表格筛选器类型
 */
export interface TableFilter {
  /** 筛选值 */
  value: any;
  /** 显示文本 */
  text: string;
}

/**
 * 表格Props类型
 */
export interface TableProps<T = any> extends BaseComponentProps {
  /** 列定义 */
  columns: TableColumn<T>[];
  /** 数据源 */
  dataSource: T[];
  /** 行键 */
  rowKey?: keyof T | ((record: T) => string);
  /** 加载状态 */
  loading?: boolean;
  /** 分页配置 */
  pagination?: TablePaginationProps;
  /** 行选择配置 */
  rowSelection?: TableRowSelectionProps<T>;
  /** 排序变化回调 */
  onSortChange?: (key: string, order: 'asc' | 'desc' | null) => void;
  /** 筛选变化回调 */
  onFilterChange?: (filters: Record<string, any>) => void;
  /** 行点击回调 */
  onRowClick?: (record: T, index: number) => void;
  /** 空数据提示 */
  emptyText?: string;
  /** 是否可滚动 */
  scroll?: { x?: number; y?: number };
}

/**
 * 表格分页Props类型
 */
export interface TablePaginationProps {
  /** 当前页 */
  current: number;
  /** 每页数量 */
  pageSize: number;
  /** 总数 */
  total: number;
  /** 分页变化回调 */
  onChange: (page: number, pageSize: number) => void;
  /** 是否显示每页数量选择器 */
  showSizeChanger?: boolean;
  /** 是否显示快速跳转 */
  showQuickJumper?: boolean;
  /** 是否显示总数 */
  showTotal?: boolean | ((total: number, range: [number, number]) => ReactNode);
}

/**
 * 表格行选择Props类型
 */
export interface TableRowSelectionProps<T = any> {
  /** 选择类型 */
  type?: 'checkbox' | 'radio';
  /** 已选择的行键 */
  selectedRowKeys: string[];
  /** 选择变化回调 */
  onChange: (selectedRowKeys: string[], selectedRows: T[]) => void;
  /** 全选回调 */
  onSelectAll?: (selected: boolean, selectedRows: T[], changeRows: T[]) => void;
  /** 单选回调 */
  onSelect?: (record: T, selected: boolean, selectedRows: T[]) => void;
  /** 获取选择框属性 */
  getCheckboxProps?: (record: T) => { disabled?: boolean; name?: string };
}

/**
 * 表单字段Props类型
 */
export interface FormFieldProps extends BaseComponentProps {
  /** 字段名 */
  name: string;
  /** 标签 */
  label?: string;
  /** 是否必填 */
  required?: boolean;
  /** 验证规则 */
  rules?: ValidationRule[];
  /** 帮助文本 */
  help?: string;
  /** 额外信息 */
  extra?: ReactNode;
  /** 标签宽度 */
  labelWidth?: number | string;
}

/**
 * 验证规则类型
 */
export interface ValidationRule {
  /** 是否必填 */
  required?: boolean;
  /** 错误信息 */
  message?: string;
  /** 最小长度 */
  min?: number;
  /** 最大长度 */
  max?: number;
  /** 正则表达式 */
  pattern?: RegExp;
  /** 自定义验证函数 */
  validator?: (value: any) => boolean | string | Promise<boolean | string>;
  /** 验证类型 */
  type?: 'string' | 'number' | 'email' | 'url' | 'date';
}

/**
 * 分页组件Props类型
 */
export interface PaginationProps extends BaseComponentProps {
  /** 当前页 */
  current: number;
  /** 总数 */
  total: number;
  /** 每页数量 */
  pageSize?: number;
  /** 每页数量选项 */
  pageSizeOptions?: number[];
  /** 页面变化回调 */
  onChange: (page: number, pageSize: number) => void;
  /** 是否显示快速跳转 */
  showQuickJumper?: boolean;
  /** 是否显示每页数量选择器 */
  showSizeChanger?: boolean;
  /** 是否显示总数 */
  showTotal?: boolean | ((total: number, range: [number, number]) => ReactNode);
  /** 尺寸 */
  size?: 'small' | 'default' | 'large';
  /** 是否简洁模式 */
  simple?: boolean;
}

/**
 * 加载状态Props类型
 */
export interface LoadingProps extends BaseComponentProps {
  /** 是否加载中 */
  loading?: boolean;
  /** 加载文本 */
  text?: string;
  /** 加载指示器尺寸 */
  size?: 'small' | 'default' | 'large';
  /** 延迟显示时间（毫秒） */
  delay?: number;
  /** 是否作为容器包装器 */
  wrapper?: boolean;
}

/**
 * 空状态Props类型
 */
export interface EmptyProps extends BaseComponentProps {
  /** 描述文本 */
  description?: string;
  /** 图片URL */
  image?: string;
  /** 自定义图片 */
  imageStyle?: React.CSSProperties;
  /** 操作区域 */
  actions?: ReactNode;
}

/**
 * 高阶组件Props类型
 */
export interface WithLoadingProps {
  loading?: boolean;
}

export interface WithErrorProps {
  error?: string | null;
  onRetry?: () => void;
}

/**
 * 组件状态类型
 */
export type ComponentStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * 异步操作状态类型
 */
export interface AsyncState<T = any> {
  /** 数据 */
  data: T | null;
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 状态 */
  status: ComponentStatus;
}

/**
 * 工具类型：提取组件Props类型
 */
export type ExtractProps<C> = C extends ComponentType<infer P> ? P : never;

/**
 * 工具类型：可选属性
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 工具类型：必需属性
 */
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * 主题颜色类型
 */
export type ThemeColor = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info';

/**
 * 尺寸类型
 */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * 响应式断点类型
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * 响应式值类型
 */
export type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;