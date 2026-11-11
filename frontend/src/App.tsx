import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  ArrowUpRight,
  Bell,
  ChevronRight,
  FileText,
  Search,
  UploadCloud,
  UserCircle2,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'
const navItems = [
  'Overview',
  'Invoices',
  'Invoice Intake',
  'Purchase Orders',
  'Goods Receipts',
  'Matching Center',
  'Exceptions',
  'Approvals',
  'Payments',
  'Vendors',
  'Analytics',
  'Audit Trail',
  'Settings',
]

const getStatusTone = (status: string) => {
  if (status === 'MATCHED' || status === 'APPROVED' || status === 'READY') return 'bg-emerald-100 text-emerald-700'
  if (status === 'EXCEPTION' || status === 'PENDING' || status === 'OPEN') return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-700'
}

function App() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [dashboard, setDashboard] = useState({ total_invoices: 0, matched: 0, exceptions: 0, pending_approvals: 0, payment_ready: 0, total_invoice_value: 0 })
  const [invoices, setInvoices] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [goodsReceipts, setGoodsReceipts] = useState<any[]>([])
  const [exceptions, setExceptions] = useState<any[]>([])
  const [approvals, setApprovals] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [audit, setAudit] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadMessage, setUploadMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setApiError(null)

    const requests = [
      { key: 'dashboard', promise: axios.get(`${API_BASE}/dashboard`) },
      { key: 'invoices', promise: axios.get(`${API_BASE}/invoices`) },
      { key: 'vendors', promise: axios.get(`${API_BASE}/vendors`) },
      { key: 'purchaseOrders', promise: axios.get(`${API_BASE}/purchase-orders`) },
      { key: 'goodsReceipts', promise: axios.get(`${API_BASE}/goods-receipts`) },
      { key: 'exceptions', promise: axios.get(`${API_BASE}/exceptions`) },
      { key: 'approvals', promise: axios.get(`${API_BASE}/approvals`) },
      { key: 'payments', promise: axios.get(`${API_BASE}/payments`) },
      { key: 'audit', promise: axios.get(`${API_BASE}/audit`) },
      { key: 'analytics', promise: axios.get(`${API_BASE}/analytics`) },
    ]

    const settled = await Promise.allSettled(requests.map(({ promise }) => promise))
    const failed = settled.filter((result) => result.status === 'rejected')

    if (failed.length > 0) {
      const messages = failed
        .map((result) => {
          if (result.status === 'rejected') {
            const err = result.reason
            return err?.response?.status
              ? `Request failed (${err.response.status})`
              : 'Request failed'
          }
          return null
        })
        .filter(Boolean)
      setApiError(messages.length ? messages.join(' · ') : 'Unable to load the invoice data from the backend.')
    }

    const dashboardRes = settled[0]
    const invoiceRes = settled[1]
    const vendorRes = settled[2]
    const purchaseOrderRes = settled[3]
    const goodsReceiptRes = settled[4]
    const exceptionRes = settled[5]
    const approvalRes = settled[6]
    const paymentRes = settled[7]
    const auditRes = settled[8]
    const analyticsRes = settled[9]

    if (dashboardRes.status === 'fulfilled') setDashboard(dashboardRes.value.data)
    if (invoiceRes.status === 'fulfilled') {
      const rows = invoiceRes.value.data || []
      setInvoices(rows)
      if (rows.length > 0) {
        const first = rows[0]
        try {
          const detail = await axios.get(`${API_BASE}/invoices/${first.id}`)
          setSelectedInvoice(detail.data)
        } catch {
          setSelectedInvoice(null)
        }
      } else {
        setSelectedInvoice(null)
      }
    }
    if (vendorRes.status === 'fulfilled') setVendors(vendorRes.value.data || [])
    if (purchaseOrderRes.status === 'fulfilled') setPurchaseOrders(purchaseOrderRes.value.data || [])
    if (goodsReceiptRes.status === 'fulfilled') setGoodsReceipts(goodsReceiptRes.value.data || [])
    if (exceptionRes.status === 'fulfilled') setExceptions(exceptionRes.value.data || [])
    if (approvalRes.status === 'fulfilled') setApprovals(approvalRes.value.data || [])
    if (paymentRes.status === 'fulfilled') setPayments(paymentRes.value.data || [])
    if (auditRes.status === 'fulfilled') setAudit(auditRes.value.data || [])
    if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data)

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleUpload = async () => {
    if (!selectedFiles.length) return
    const formData = new FormData()
    selectedFiles.forEach((file) => formData.append('files', file))
    const response = await axios.post(`${API_BASE}/invoices/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    setUploadMessage(`Processed ${response.data.results.length} invoice(s) successfully.`)
    setSelectedFiles([])
    await loadData()
    setActiveTab('Invoices')
  }

  const handleMatch = async (invoiceId: string) => {
    await axios.post(`${API_BASE}/invoices/${invoiceId}/match`)
    await loadData()
  }

  const handleResolveException = async (exceptionId: string) => {
    await axios.post(`${API_BASE}/exceptions/${exceptionId}/resolve`, { notes: 'Investigated and resolved in demo workflow.' })
    await loadData()
  }

  const handleApprove = async (approvalId: string) => {
    await axios.post(`${API_BASE}/approvals/${approvalId}/approve`, { decision: 'APPROVED', comments: 'Approved in demo workflow.' })
    await loadData()
  }

  const fiscalSummary = useMemo(() => {
    return [
      { label: 'Total invoices', value: dashboard.total_invoices || 0 },
      { label: 'Successfully matched', value: dashboard.matched || 0 },
      { label: 'Exceptions', value: dashboard.exceptions || 0 },
      { label: 'Payment-ready', value: dashboard.payment_ready || 0 },
    ]
  }, [dashboard])

  const trendData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const counts = new Map<string, number>()

    invoices.forEach((invoice) => {
      if (!invoice.invoice_date) return
      const date = new Date(invoice.invoice_date)
      if (Number.isNaN(date.getTime())) return
      const key = `${date.getFullYear()}-${date.getMonth()}`
      counts.set(key, (counts.get(key) || 0) + 1)
    })

    const base = [] as { name: string; value: number }[]
    const now = new Date()
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      base.push({
        name: monthNames[date.getMonth()],
        value: counts.get(key) || 0,
      })
    }

    return base
  }, [invoices])

  const matchBreakdown = [
    { name: 'Matched', value: Number(dashboard.matched || 0), color: '#14b8a6' },
    { name: 'Exceptions', value: Number(dashboard.exceptions || 0), color: '#f59e0b' },
    { name: 'Pending', value: Number(dashboard.pending_approvals || 0), color: '#0f172a' },
  ]

  const recentInvoices = invoices.slice(0, 5)
  const recentExceptions = exceptions.slice(0, 4)

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-800">Loading InvoiceFlow AI…</div>
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <div className="flex min-h-screen">
        <aside className="w-72 border-r border-slate-200 bg-slate-950 text-slate-100">
          <div className="border-b border-slate-800 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-teal-500 p-2 text-slate-950">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Finance Ops</div>
                <div className="text-lg font-semibold">InvoiceFlow AI</div>
              </div>
            </div>
          </div>

          <nav className="space-y-1 p-4">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => setActiveTab(item)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                  activeTab === item ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <span>{item}</span>
                <ChevronRight className="h-4 w-4 opacity-80" />
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
            <div className="relative w-full max-w-lg">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                aria-label="Search invoices"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none ring-0 focus:border-teal-500"
                placeholder="Search invoice, vendor, PO…"
              />
            </div>

            <div className="ml-6 flex items-center gap-4">
              <button className="relative rounded-full border border-slate-200 p-2 text-slate-600">
                <Bell className="h-4 w-4" />
                <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-amber-400" />
              </button>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2">
                <UserCircle2 className="h-8 w-8 text-slate-500" />
                <div>
                  <div className="text-sm font-semibold text-slate-800">Alicia Morgan</div>
                  <div className="text-xs text-slate-500">Process Owner</div>
                </div>
              </div>
            </div>
          </header>

          <main className="p-6">
            {apiError && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {apiError}
              </div>
            )}
            {activeTab === 'Overview' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm uppercase tracking-[0.2em] text-teal-700">Dashboard</div>
                    <h1 className="mt-2 text-3xl font-semibold text-slate-900">Evidence-driven invoice operations</h1>
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                    <ArrowUpRight className="h-4 w-4" />
                    Export report
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  {fiscalSummary.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="text-sm text-slate-500">{item.label}</div>
                      <div className="mt-3 text-3xl font-semibold text-slate-900">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-6 xl:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-slate-900">Invoice processing trend</h2>
                      <span className="text-sm text-slate-500">Last 6 months</span>
                    </div>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#14b8a6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Match-status distribution</h2>
                    <div className="mt-6 h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={matchBreakdown} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={4}>
                            {matchBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">Recent invoices</h3>
                    <div className="mt-4 space-y-3">
                      {recentInvoices.map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                          <div>
                            <div className="font-medium text-slate-800">{invoice.invoice_number}</div>
                            <div className="text-sm text-slate-500">{invoice.vendor_name}</div>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusTone(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">Highest-priority exceptions</h3>
                    <div className="mt-4 space-y-3">
                      {recentExceptions.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3">
                          <div>
                            <div className="font-medium text-slate-800">{item.exception_type}</div>
                            <div className="text-sm text-slate-600">{item.vendor}</div>
                          </div>
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">{item.severity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Invoice Intake' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-semibold text-slate-900">Invoice intake</h1>
                <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <UploadCloud className="mx-auto h-10 w-10 text-slate-500" />
                    <div className="mt-4 text-lg font-medium text-slate-800">Drop PDF invoices here</div>
                    <p className="mt-2 text-sm text-slate-500">Supports multiple documents and manual review fallback</p>
                    <label className="mt-5 inline-flex cursor-pointer rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
                      Select files
                      <input multiple type="file" className="hidden" onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))} />
                    </label>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="text-sm font-medium uppercase tracking-[0.15em] text-slate-500">Document queue</div>
                    <div className="mt-4 space-y-2">
                      {selectedFiles.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">No documents added yet.</div>
                      ) : (
                        selectedFiles.map((file) => (
                          <div key={file.name} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
                            <span className="truncate text-sm font-medium text-slate-700">{file.name}</span>
                            <span className="text-xs text-slate-500">Ready</span>
                          </div>
                        ))
                      )}
                    </div>
                    <button
                      onClick={handleUpload}
                      className="mt-5 w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-50"
                      disabled={!selectedFiles.length}
                    >
                      Process invoice files
                    </button>
                    {uploadMessage && <div className="mt-4 text-sm text-emerald-700">{uploadMessage}</div>}
                  </div>
                </div>
              </div>
            )}

            {(activeTab === 'Invoices' || activeTab === 'Matching Center') && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900">Invoice register</h2>
                    <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">Filters</button>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-left">
                      <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Invoice</th>
                          <th className="px-4 py-3">Vendor</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Total</th>
                          <th className="px-4 py-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {invoices.map((invoice) => (
                          <tr key={invoice.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <button onClick={() => setSelectedInvoice(invoice)} className="font-medium text-slate-800 underline-offset-2 hover:underline">
                                {invoice.invoice_number}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{invoice.vendor_name}</td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusTone(invoice.status)}`}>{invoice.status}</span>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-800">${Number(invoice.total || 0).toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <button onClick={() => handleMatch(invoice.id)} className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs text-white">
                                Match
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedInvoice && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm uppercase tracking-[0.15em] text-slate-500">Invoice preview</span>
                          <span className="text-xs text-slate-500">PDF</span>
                        </div>
                        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="mb-4 text-lg font-semibold text-slate-900">{selectedInvoice.invoice_number}</div>
                          <div className="space-y-2 text-sm text-slate-600">
                            <div>Vendor: {selectedInvoice.vendor_name || 'Acme Supplies'}</div>
                            <div>PO: {selectedInvoice.po_number || 'PO-2026-000001'}</div>
                            <div>Date: {selectedInvoice.invoice_date || '2026-06-15'}</div>
                            <div>Total: ${Number(selectedInvoice.total || 0).toFixed(2)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 p-4">
                          <h3 className="text-lg font-semibold text-slate-900">Extracted fields</h3>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div><div className="text-xs uppercase tracking-[0.12em] text-slate-500">Vendor</div><div className="mt-1 font-medium">{selectedInvoice.vendor_name}</div></div>
                            <div><div className="text-xs uppercase tracking-[0.12em] text-slate-500">Invoice no.</div><div className="mt-1 font-medium">{selectedInvoice.invoice_number}</div></div>
                            <div><div className="text-xs uppercase tracking-[0.12em] text-slate-500">PO no.</div><div className="mt-1 font-medium">{selectedInvoice.po_number || 'N/A'}</div></div>
                            <div><div className="text-xs uppercase tracking-[0.12em] text-slate-500">Currency</div><div className="mt-1 font-medium">{selectedInvoice.currency || 'USD'}</div></div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 p-4">
                          <h3 className="text-lg font-semibold text-slate-900">Matching evidence</h3>
                          <div className="mt-4 space-y-3">
                            <div className="flex justify-between text-sm"><span>PO value</span><strong>$1,250.00</strong></div>
                            <div className="flex justify-between text-sm"><span>Receipt value</span><strong>$1,120.00</strong></div>
                            <div className="flex justify-between text-sm"><span>Difference</span><strong className="text-amber-600">$130.00</strong></div>
                            <div className="flex justify-between text-sm"><span>Rule</span><strong>1% price tolerance</strong></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Purchase Orders' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-semibold text-slate-900">Purchase orders</h1>
                <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">PO number</th>
                        <th className="px-4 py-3">Vendor</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {purchaseOrders.map((po) => (
                        <tr key={po.id}>
                          <td className="px-4 py-3 font-medium text-slate-800">{po.po_number}</td>
                          <td className="px-4 py-3 text-slate-600">{po.vendor_id || 'Unknown vendor'}</td>
                          <td className="px-4 py-3 text-slate-600">{po.order_date || 'N/A'}</td>
                          <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusTone(po.status || 'OPEN')}`}>{po.status || 'OPEN'}</span></td>
                          <td className="px-4 py-3 font-medium text-slate-800">${Number(po.total_amount || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'Goods Receipts' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-semibold text-slate-900">Goods receipts</h1>
                <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Receipt</th>
                        <th className="px-4 py-3">Vendor</th>
                        <th className="px-4 py-3">PO</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {goodsReceipts.map((receipt) => (
                        <tr key={receipt.id}>
                          <td className="px-4 py-3 font-medium text-slate-800">{receipt.receipt_number}</td>
                          <td className="px-4 py-3 text-slate-600">{receipt.vendor_id || 'Unknown vendor'}</td>
                          <td className="px-4 py-3 text-slate-600">{receipt.po_id || 'N/A'}</td>
                          <td className="px-4 py-3 text-slate-600">{receipt.receipt_date || 'N/A'}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">${Number(receipt.total_amount || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'Vendors' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-semibold text-slate-900">Vendor register</h1>
                <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Vendor</th>
                        <th className="px-4 py-3">Vendor code</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Tax ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {vendors.map((vendor) => (
                        <tr key={vendor.id}>
                          <td className="px-4 py-3 font-medium text-slate-800">{vendor.name}</td>
                          <td className="px-4 py-3 text-slate-600">{vendor.vendor_code}</td>
                          <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusTone(vendor.status || 'ACTIVE')}`}>{vendor.status || 'ACTIVE'}</span></td>
                          <td className="px-4 py-3 text-slate-600">{vendor.tax_id || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'Exceptions' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-semibold text-slate-900">Exception queue</h1>
                <div className="mt-6 space-y-4">
                  {exceptions.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-lg font-semibold text-slate-900">{item.exception_type}</div>
                          <div className="mt-1 text-sm text-slate-600">Invoice {item.invoice_id} · {item.vendor}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">{item.severity}</span>
                          <button onClick={() => handleResolveException(item.id)} className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs text-white">Resolve</button>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-slate-700">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Approvals' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-semibold text-slate-900">Approval center</h1>
                <div className="mt-6 space-y-4">
                  {approvals.map((approval) => (
                    <div key={approval.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-900">{approval.invoice_id}</div>
                          <div className="text-sm text-slate-500">Approver: {approval.approver}</div>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusTone(approval.status)}`}>{approval.status}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-sm text-slate-600">{approval.comments || 'Awaiting approval.'}</p>
                        <button onClick={() => handleApprove(approval.id)} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white">Approve</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Payments' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-semibold text-slate-900">Payment readiness</h1>
                <div className="mt-6 space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                      <div>
                        <div className="font-semibold text-slate-900">{payment.payment_reference}</div>
                        <div className="text-sm text-slate-500">Invoice {payment.invoice_id}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-slate-900">${Number(payment.amount || 0).toFixed(2)}</div>
                        <div className="text-xs text-slate-500">{payment.payment_status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Analytics' && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-slate-900">Processing quality</h2>
                  <div className="mt-6 space-y-4">
                    {(analytics ? [
                      ['Field extraction accuracy', analytics.field_extraction_accuracy],
                      ['Match accuracy', analytics.match_accuracy],
                      ['Duplicate detection accuracy', analytics.duplicate_detection_accuracy],
                      ['Payment safety violations', analytics.payment_safety_violations],
                    ] : [
                      ['Field extraction accuracy', '0.00'],
                      ['Match accuracy', '0.00'],
                      ['Duplicate detection accuracy', '0.00'],
                      ['Payment safety violations', '0'],
                    ]).map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                        <span className="text-sm text-slate-600">{label}</span>
                        <span className="font-semibold text-slate-900">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-slate-900">Operational metrics</h2>
                  <div className="mt-6 space-y-4">
                    {(analytics ? [
                      ['False positive rate', analytics.false_positive_rate],
                      ['False negative rate', analytics.false_negative_rate],
                      ['Straight-through processing rate', analytics.straight_through_processing_rate],
                      ['Average processing time (minutes)', analytics.average_processing_time_minutes],
                    ] : [
                      ['False positive rate', '0.00'],
                      ['False negative rate', '0.00'],
                      ['Straight-through processing rate', '0.00'],
                      ['Average processing time (minutes)', '0.00'],
                    ]).map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                        <span className="text-sm text-slate-600">{label}</span>
                        <span className="font-semibold text-slate-900">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Audit Trail' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-semibold text-slate-900">Audit trail</h1>
                <div className="mt-6 space-y-3">
                  {audit.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-slate-900">{item.action}</div>
                        <div className="text-xs text-slate-500">{item.created_at}</div>
                      </div>
                      <div className="mt-2 text-sm text-slate-600">Entity: {item.entity} / {item.entity_id}</div>
                      <div className="mt-1 text-sm text-slate-600">Actor: {item.actor}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default App
