import { useState, useEffect } from 'react'
import { 
  clientService, 
  contractService, 
  serviceCallService, 
  teamService, 
  dashboardService 
} from '../services/database'

// Custom hook for clients
export const useClients = () => {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchClients = async () => {
    try {
      setLoading(true)
      const { data, error } = await clientService.getAll()
      if (error) throw error
      setClients(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createClient = async (clientData) => {
    try {
      const { data, error } = await clientService.create(clientData)
      if (error) throw error
      setClients(prev => [data, ...prev])
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const updateClient = async (id, clientData) => {
    try {
      const { data, error } = await clientService.update(id, clientData)
      if (error) throw error
      setClients(prev => prev.map(client => 
        client.id === id ? data : client
      ))
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const deleteClient = async (id) => {
    try {
      const { error } = await clientService.delete(id)
      if (error) throw error
      setClients(prev => prev.filter(client => client.id !== id))
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  return {
    clients,
    loading,
    error,
    refetch: fetchClients,
    createClient,
    updateClient,
    deleteClient
  }
}

// Custom hook for contracts
export const useContracts = () => {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchContracts = async () => {
    try {
      setLoading(true)
      const { data, error } = await contractService.getAll()
      if (error) throw error
      setContracts(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createContract = async (contractData) => {
    try {
      const { data, error } = await contractService.create(contractData)
      if (error) throw error
      setContracts(prev => [data, ...prev])
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const updateContract = async (id, contractData) => {
    try {
      const { data, error } = await contractService.update(id, contractData)
      if (error) throw error
      setContracts(prev => prev.map(contract => 
        contract.id === id ? data : contract
      ))
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  useEffect(() => {
    fetchContracts()
  }, [])

  return {
    contracts,
    loading,
    error,
    refetch: fetchContracts,
    createContract,
    updateContract
  }
}

// Custom hook for service calls
export const useServiceCalls = () => {
  const [serviceCalls, setServiceCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchServiceCalls = async () => {
    try {
      setLoading(true)
      const { data, error } = await serviceCallService.getAll()
      if (error) throw error
      setServiceCalls(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createServiceCall = async (serviceCallData) => {
    try {
      const { data, error } = await serviceCallService.create(serviceCallData)
      if (error) throw error
      setServiceCalls(prev => [data, ...prev])
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const updateServiceCall = async (id, serviceCallData) => {
    try {
      const { data, error } = await serviceCallService.update(id, serviceCallData)
      if (error) throw error
      setServiceCalls(prev => prev.map(call => 
        call.id === id ? data : call
      ))
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  useEffect(() => {
    fetchServiceCalls()
  }, [])

  return {
    serviceCalls,
    loading,
    error,
    refetch: fetchServiceCalls,
    createServiceCall,
    updateServiceCall
  }
}

// Custom hook for teams
export const useTeams = () => {
  const [teams, setTeams] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTeams = async () => {
    try {
      setLoading(true)
      const [teamsResult, membersResult] = await Promise.all([
        teamService.getAll(),
        teamService.getAllMembers()
      ])
      
      if (teamsResult.error) throw teamsResult.error
      if (membersResult.error) throw membersResult.error
      
      setTeams(teamsResult.data || [])
      setTeamMembers(membersResult.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createTeamMember = async (memberData) => {
    try {
      const { data, error } = await teamService.createMember(memberData)
      if (error) throw error
      setTeamMembers(prev => [data, ...prev])
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [])

  return {
    teams,
    teamMembers,
    loading,
    error,
    refetch: fetchTeams,
    createTeamMember
  }
}

// Custom hook for dashboard stats
export const useDashboard = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    activeContracts: 0,
    pendingCalls: 0,
    monthlyRenewals: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const { data, error } = await dashboardService.getStats()
      if (error) throw error
      setStats(data)
    } catch (err) {
      setError(err.message)
      // Fallback to mock data if Supabase is not configured
      setStats({
        totalClients: 0,
        activeContracts: 0,
        pendingCalls: 0,
        monthlyRenewals: 0
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}
