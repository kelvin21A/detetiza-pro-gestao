import { supabase, TABLES } from '../lib/supabase'

// Helper function to get current user's tenant_id
const getCurrentTenantId = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  
  return data?.tenant_id || null
}

// Auth Services
export const authService = {
  // Sign up new user with profile creation
  async signUp(email, password, userData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.full_name || ''
        }
      }
    })
    
    if (error) return { data, error }
    
    // Create user profile if auth user was created
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: data.user.id,
          email: data.user.email,
          full_name: userData.full_name || '',
          role: userData.role || 'technician',
          tenant_id: userData.tenant_id,
          is_active: true,
          must_change_password: userData.must_change_password || false
        }])
      
      if (profileError) {
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(data.user.id)
        return { data: null, error: profileError }
      }
    }
    
    return { data, error }
  },

  // Sign in user
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) return { data, error }
    
    // Check if user is active
    if (data.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('is_active, must_change_password')
        .eq('id', data.user.id)
        .single()
      
      if (!profile?.is_active) {
        await supabase.auth.signOut()
        return { data: null, error: { message: 'Usuário inativo' } }
      }
    }
    
    return { data, error }
  },

  // Sign out user
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Get current session
  async getCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  // Get user profile
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    return { data, error }
  }
}

// Client Services
export const clientService = {
  // Get all clients for current tenant
  async getAll() {
    const tenantId = await getCurrentTenantId()
    if (!tenantId) {
      return { data: [], error: { message: 'Tenant não encontrado' } }
    }

    const { data, error } = await supabase
      .from(TABLES.CLIENTS)
      .select(`
        *,
        contracts (
          id,
          contract_number,
          status,
          start_date,
          end_date,
          value,
          services (
            name,
            type
          )
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  // Get client by ID
  async getById(id) {
    const { data, error } = await supabase
      .from(TABLES.CLIENTS)
      .select(`
        *,
        contracts (
          *,
          services (*)
        ),
        service_calls (
          *,
          team_members (
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .single()
    
    return { data, error }
  },

  // Create new client
  async create(clientData) {
    const tenantId = await getCurrentTenantId()
    if (!tenantId) {
      return { data: null, error: { message: 'Tenant não encontrado' } }
    }

    const { data: { user } } = await supabase.auth.getUser()
    
    const clientWithTenant = {
      ...clientData,
      tenant_id: tenantId,
      created_by: user?.id,
      is_active: true
    }

    const { data, error } = await supabase
      .from(TABLES.CLIENTS)
      .insert([clientWithTenant])
      .select()
      .single()
    
    return { data, error }
  },

  // Update client
  async update(id, clientData) {
    const tenantId = await getCurrentTenantId()
    if (!tenantId) {
      return { data: null, error: { message: 'Tenant não encontrado' } }
    }

    const updateData = {
      ...clientData,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from(TABLES.CLIENTS)
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    
    return { data, error }
  },

  // Soft delete client (set is_active to false)
  async delete(id) {
    const tenantId = await getCurrentTenantId()
    if (!tenantId) {
      return { data: null, error: { message: 'Tenant não encontrado' } }
    }

    const { data, error } = await supabase
      .from(TABLES.CLIENTS)
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    
    return { data, error }
  }
}

// Contract Services
export const contractService = {
  // Get all contracts
  async getAll() {
    const { data, error } = await supabase
      .from(TABLES.CONTRACTS)
      .select(`
        *,
        clients (
          id,
          name,
          email,
          phone
        ),
        services (*)
      `)
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  // Create new contract
  async create(contractData) {
    const { data, error } = await supabase
      .from(TABLES.CONTRACTS)
      .insert([contractData])
      .select()
      .single()
    
    return { data, error }
  },

  // Update contract
  async update(id, contractData) {
    const { data, error } = await supabase
      .from(TABLES.CONTRACTS)
      .update(contractData)
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  },

  // Get contracts expiring soon
  async getExpiringContracts(days = 30) {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)
    
    const { data, error } = await supabase
      .from(TABLES.CONTRACTS)
      .select(`
        *,
        clients (
          id,
          name,
          email,
          phone
        )
      `)
      .lte('end_date', futureDate.toISOString())
      .eq('status', 'active')
      .order('end_date', { ascending: true })
    
    return { data, error }
  }
}

// Service Call Services
export const serviceCallService = {
  // Get all service calls
  async getAll() {
    const { data, error } = await supabase
      .from(TABLES.SERVICE_CALLS)
      .select(`
        *,
        clients (
          id,
          name,
          address
        ),
        contracts (
          id,
          service_type
        ),
        team_members (
          id,
          name
        )
      `)
      .order('scheduled_date', { ascending: false })
    
    return { data, error }
  },

  // Create new service call
  async create(serviceCallData) {
    const { data, error } = await supabase
      .from(TABLES.SERVICE_CALLS)
      .insert([serviceCallData])
      .select()
      .single()
    
    return { data, error }
  },

  // Update service call
  async update(id, serviceCallData) {
    const { data, error } = await supabase
      .from(TABLES.SERVICE_CALLS)
      .update(serviceCallData)
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  },

  // Get service calls by status
  async getByStatus(status) {
    const { data, error } = await supabase
      .from(TABLES.SERVICE_CALLS)
      .select(`
        *,
        clients (
          id,
          name,
          address
        ),
        team_members (
          id,
          name
        )
      `)
      .eq('status', status)
      .order('scheduled_date', { ascending: true })
    
    return { data, error }
  }
}

// Team Services
export const teamService = {
  // Get all teams
  async getAll() {
    const { data, error } = await supabase
      .from(TABLES.TEAMS)
      .select(`
        *,
        team_members (
          id,
          name,
          role,
          phone,
          email
        )
      `)
      .order('name', { ascending: true })
    
    return { data, error }
  },

  // Get all team members
  async getAllMembers() {
    const { data, error } = await supabase
      .from(TABLES.TEAM_MEMBERS)
      .select(`
        *,
        teams (
          id,
          name
        )
      `)
      .order('name', { ascending: true })
    
    return { data, error }
  },

  // Create new team member
  async createMember(memberData) {
    const { data, error } = await supabase
      .from(TABLES.TEAM_MEMBERS)
      .insert([memberData])
      .select()
      .single()
    
    return { data, error }
  }
}

// Dashboard Services
export const dashboardService = {
  // Get dashboard statistics
  async getStats() {
    try {
      // Get total clients
      const { count: totalClients } = await supabase
        .from(TABLES.CLIENTS)
        .select('*', { count: 'exact', head: true })

      // Get active contracts
      const { count: activeContracts } = await supabase
        .from(TABLES.CONTRACTS)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // Get pending service calls
      const { count: pendingCalls } = await supabase
        .from(TABLES.SERVICE_CALLS)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Get renewals this month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      const endOfMonth = new Date()
      endOfMonth.setMonth(endOfMonth.getMonth() + 1)
      endOfMonth.setDate(0)

      const { count: monthlyRenewals } = await supabase
        .from(TABLES.CONTRACTS)
        .select('*', { count: 'exact', head: true })
        .gte('end_date', startOfMonth.toISOString())
        .lte('end_date', endOfMonth.toISOString())

      return {
        data: {
          totalClients: totalClients || 0,
          activeContracts: activeContracts || 0,
          pendingCalls: pendingCalls || 0,
          monthlyRenewals: monthlyRenewals || 0
        },
        error: null
      }
    } catch (error) {
      return { data: null, error }
    }
  }
}
