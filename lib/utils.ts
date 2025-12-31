// pftu\lib\utils.ts
// Format currency to IDR
export const formatCurrency = (amount: number, currency: string = 'IDR'): string => {
  const numAmount = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
};

// Format number with thousand separators
export const formatNumber = (num: number): string => {
  const numValue = Number(num) || 0;
  return new Intl.NumberFormat('id-ID').format(numValue);
};

// Format date
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
};

// Format date for input
export const formatDateInput = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
};

// Calculate percentage
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

// Get color based on budget status
export const getBudgetColor = (percentage: number): string => {
  if (percentage >= 100) return 'danger';
  if (percentage >= 80) return 'warning';
  return 'success';
};

// Get status badge color
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    active: 'success',
    completed: 'info',
    paused: 'warning',
    paid_off: 'success',
    overdue: 'danger',
  };
  return statusColors[status] || 'info';
};

// Truncate text
export const truncate = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

// Get days remaining
export const getDaysRemaining = (targetDate: Date | string): number => {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Calculate monthly required savings
export const calculateMonthlyRequired = (
  targetAmount: number,
  currentAmount: number,
  targetDate: Date | string
): number => {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const now = new Date();
  const monthsRemaining = (target.getFullYear() - now.getFullYear()) * 12 + 
                         (target.getMonth() - now.getMonth());
  
  if (monthsRemaining <= 0) return targetAmount - currentAmount;
  
  return (targetAmount - currentAmount) / monthsRemaining;
};

// Get priority color
export const getPriorityColor = (priority: string): string => {
  const priorityColors: Record<string, string> = {
    high: 'danger',
    medium: 'warning',
    low: 'info',
  };
  return priorityColors[priority] || 'info';
};

// Format percentage - PERBAIKAN DISINI
export const formatPercentage = (value: number | null | undefined, decimals: number = 2): string => {
  // Convert to number and handle null/undefined
  const numValue = Number(value) || 0;
  
  // Check if it's a valid number
  if (isNaN(numValue)) {
    return '0%';
  }
  
  return `${numValue.toFixed(decimals)}%`;
};