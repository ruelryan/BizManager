export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          barcode: string | null;
          category: string;
          cost: number;
          price: number;
          stock: number;
          min_stock: number;
          unit: string;
          is_active: boolean;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          barcode?: string | null;
          category: string;
          cost: number;
          price: number;
          stock?: number;
          min_stock?: number;
          unit: string;
          is_active?: boolean;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          barcode?: string | null;
          category?: string;
          cost?: number;
          price?: number;
          stock?: number;
          min_stock?: number;
          unit?: string;
          is_active?: boolean;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      sales: {
        Row: {
          id: string;
          receipt_number: string;
          items: any;
          subtotal: number;
          tax: number;
          discount: number;
          total: number;
          payments: any;
          customer_id: string | null;
          customer_name: string | null;
          customer_email: string | null;
          cashier_id: string;
          cashier_name: string;
          status: string;
          user_id: string;
          created_at: string;
          notes: string | null;
          installment_id: string | null;
        };
        Insert: {
          id?: string;
          receipt_number: string;
          items: any;
          subtotal: number;
          tax?: number;
          discount?: number;
          total: number;
          payments: any;
          customer_id?: string | null;
          customer_name?: string | null;
          customer_email?: string | null;
          cashier_id: string;
          cashier_name: string;
          status: string;
          user_id: string;
          created_at?: string;
          notes?: string | null;
          installment_id?: string | null;
        };
        Update: {
          id?: string;
          receipt_number?: string;
          items?: any;
          subtotal?: number;
          tax?: number;
          discount?: number;
          total?: number;
          payments?: any;
          customer_id?: string | null;
          customer_name?: string | null;
          customer_email?: string | null;
          cashier_id?: string;
          cashier_name?: string;
          status?: string;
          user_id?: string;
          created_at?: string;
          notes?: string | null;
          installment_id?: string | null;
        };
      };
      customers: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          balance: number;
          credit_limit: number;
          is_active: boolean;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          balance?: number;
          credit_limit?: number;
          is_active?: boolean;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          balance?: number;
          credit_limit?: number;
          is_active?: boolean;
          user_id?: string;
          created_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          monthly_goal: number;
          currency: string;
          business_name: string | null;
          business_address: string | null;
          business_phone: string | null;
          business_email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          monthly_goal?: number;
          currency?: string;
          business_name?: string | null;
          business_address?: string | null;
          business_phone?: string | null;
          business_email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          monthly_goal?: number;
          currency?: string;
          business_name?: string | null;
          business_address?: string | null;
          business_phone?: string | null;
          business_email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          description: string;
          amount: number;
          category: string;
          date: string;
          payment_method: string;
          receipt: string | null;
          notes: string | null;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          description: string;
          amount: number;
          category: string;
          date: string;
          payment_method: string;
          receipt?: string | null;
          notes?: string | null;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          description?: string;
          amount?: number;
          category?: string;
          date?: string;
          payment_method?: string;
          receipt?: string | null;
          notes?: string | null;
          user_id?: string;
          created_at?: string;
        };
      };
      installment_plans: {
        Row: {
          id: string;
          customer_id: string | null;
          total_amount: number;
          down_payment: number;
          remaining_balance: number;
          term_months: number;
          interest_rate: number;
          status: string;
          start_date: string;
          end_date: string;
          notes: string | null;
          sale_id: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          total_amount: number;
          down_payment: number;
          remaining_balance: number;
          term_months: number;
          interest_rate: number;
          status: string;
          start_date: string;
          end_date: string;
          notes?: string | null;
          sale_id?: string | null;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          total_amount?: number;
          down_payment?: number;
          remaining_balance?: number;
          term_months?: number;
          interest_rate?: number;
          status?: string;
          start_date?: string;
          end_date?: string;
          notes?: string | null;
          sale_id?: string | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      installment_payments: {
        Row: {
          id: string;
          installment_plan_id: string;
          amount: number;
          due_date: string;
          payment_date: string | null;
          status: string;
          payment_method: string | null;
          notes: string | null;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          installment_plan_id: string;
          amount: number;
          due_date: string;
          payment_date?: string | null;
          status: string;
          payment_method?: string | null;
          notes?: string | null;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          installment_plan_id?: string;
          amount?: number;
          due_date?: string;
          payment_date?: string | null;
          status?: string;
          payment_method?: string | null;
          notes?: string | null;
          user_id?: string;
          created_at?: string;
        };
      };
      payment_reminders: {
        Row: {
          id: string;
          installment_payment_id: string;
          reminder_date: string;
          sent: boolean;
          reminder_type: string;
          message: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          installment_payment_id: string;
          reminder_date: string;
          sent?: boolean;
          reminder_type: string;
          message: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          installment_payment_id?: string;
          reminder_date?: string;
          sent?: boolean;
          reminder_type?: string;
          message?: string;
          user_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}