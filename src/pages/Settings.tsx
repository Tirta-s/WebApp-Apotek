import { useState, useEffect } from "react";
import { SideNavBar, BottomNavBar, MobileHeader } from "../components/Navigation";
import { Navigate } from "react-router-dom";

export default function Settings() {
  const userRole = localStorage.getItem("userRole") || "Staff";
  const userBranch = localStorage.getItem("userBranch") || "Utama - Jakarta Selatan";
  const isManager = userRole === "Manager";
  const isPengelola = userRole === "Pengelola Apotek";
  const userName = localStorage.getItem("userName") || userRole;
  
  const getHeaders = () => ({
    "Content-Type": "application/json",
    "x-actor": userName
  });

  const [activeTab, setActiveTab] = useState("accounts");
  
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [targetSettings, setTargetSettings] = useState({
    shift: 0,
    day: 0,
    month: 0,
    quarter: 0,
    year: 0
  });
  const [isSavingTargets, setIsSavingTargets] = useState(false);

  const [patientList, setPatientList] = useState<any[]>([]);
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({ nik: "", name: "", address: "" });
  const [isEditPatientModalOpen, setIsEditPatientModalOpen] = useState(false);
  const [editPatientForm, setEditPatientForm] = useState({ id: "", nik: "", name: "", address: "" });
  const [isDeletePatientModalOpen, setIsDeletePatientModalOpen] = useState(false);
  const [deletePatientId, setDeletePatientId] = useState<string | null>(null);

  const [embalaseList, setEmbalaseList] = useState<any[]>([]);
  const [isAddEmbalaseModalOpen, setIsAddEmbalaseModalOpen] = useState(false);
  const [newEmbalaseForm, setNewEmbalaseForm] = useState({ name: "", price: 0 });
  
  const [isAddPbfModalOpen, setIsAddPbfModalOpen] = useState(false);
  const [isEditPbfModalOpen, setIsEditPbfModalOpen] = useState(false);
  const [pbfList, setPbfList] = useState<any[]>([]);
  const [newPbfForm, setNewPbfForm] = useState({ name: "", sales: "", phone: "", license: "", address: "" });
  const [editPbfForm, setEditPbfForm] = useState({ id: "", name: "", sales: "", phone: "", license: "", address: "" });

  const [isAddDrugModalOpen, setIsAddDrugModalOpen] = useState(false);
  const [newDrugForm, setNewDrugForm] = useState({ name: "", type: "Tablet" });
  const [isEditDrugModalOpen, setIsEditDrugModalOpen] = useState(false);
  const [editDrugForm, setEditDrugForm] = useState({ id: "", name: "", type: "Tablet" });
  const [isDeleteDrugModalOpen, setIsDeleteDrugModalOpen] = useState(false);
  const [deleteDrugId, setDeleteDrugId] = useState<string | null>(null);
  const [inventoryList, setInventoryList] = useState<any[]>([]);

  const [conversionList, setConversionList] = useState<any[]>([]);
  const [isAddConvModalOpen, setIsAddConvModalOpen] = useState(false);
  const [newConvForm, setNewConvForm] = useState({ name: "", besar: "", sedang_qty: "", sedang: "", kecil_qty: "", kecil: "" });
  const [isEditConvModalOpen, setIsEditConvModalOpen] = useState(false);
  const [editConvForm, setEditConvForm] = useState({ id: "", name: "", besar: "", sedang_qty: "", sedang: "", kecil_qty: "", kecil: "" });
  const [isDeleteConvModalOpen, setIsDeleteConvModalOpen] = useState(false);
  const [deleteConvId, setDeleteConvId] = useState<string | null>(null);

  const [accountList, setAccountList] = useState<any[]>([]);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [newAccountForm, setNewAccountForm] = useState({ name: "", role: "Staff", username: "", password: "" });
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
  const [editAccountForm, setEditAccountForm] = useState({ id: "", name: "", role: "Staff", username: "", password: "" });
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);

  const [searchDrug, setSearchDrug] = useState("");

  useEffect(() => {
    fetch('/api/audit-logs')
      .then(res => res.json())
      .then(data => setAuditLogs(data));

    fetch('/api/targets')
      .then(res => res.json())
      .then(data => setTargetSettings(data));

    fetch('/api/embalase')
      .then(res => res.json())
      .then(data => setEmbalaseList(data));

    fetch('/api/patients')
      .then(res => res.json())
      .then(data => setPatientList(data));

    fetch('/api/pbf')
      .then(res => res.json())
      .then(data => setPbfList(data));
      
    fetch('/api/inventory')
      .then(res => res.json())
      .then(data => setInventoryList(data));

    fetch('/api/conversions')
      .then(res => res.json())
      .then(data => setConversionList(data));

    fetch('/api/accounts')
      .then(res => res.json())
      .then(data => setAccountList(data));
  }, []);

  const handleSaveTargets = async () => {
    setIsSavingTargets(true);
    try {
      const res = await fetch('/api/targets', {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(targetSettings)
      });
      if (res.ok) {
        alert("Target settings saved successfully.");
      } else {
        alert("Failed to save target settings.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred while saving target settings.");
    } finally {
      setIsSavingTargets(false);
    }
  };

  const handleAddConv = async () => {
    try {
      let generatedRule = `1 ${newConvForm.besar || '...'} = ${newConvForm.sedang_qty || 0} ${newConvForm.sedang || '...'}`;
      if (newConvForm.kecil_qty && newConvForm.kecil) {
        generatedRule += ` = ${(Number(newConvForm.sedang_qty) || 0) * (Number(newConvForm.kecil_qty) || 0)} ${newConvForm.kecil}`;
      }
      const payload = { ...newConvForm, rule: generatedRule };

      const res = await fetch('/api/conversions', {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const added = await res.json();
        setConversionList([...conversionList, added]);
        setNewConvForm({ name: "", besar: "", sedang_qty: "", sedang: "", kecil_qty: "", kecil: "" });
        setIsAddConvModalOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditConv = async () => {
    if (!editConvForm.id) return;
    try {
      let generatedRule = `1 ${editConvForm.besar || '...'} = ${editConvForm.sedang_qty || 0} ${editConvForm.sedang || '...'}`;
      if (editConvForm.kecil_qty && editConvForm.kecil) {
        generatedRule += ` = ${(Number(editConvForm.sedang_qty) || 0) * (Number(editConvForm.kecil_qty) || 0)} ${editConvForm.kecil}`;
      }
      const payload = { ...editConvForm, rule: generatedRule };

      const res = await fetch(`/api/conversions/${editConvForm.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updated = await res.json();
        setConversionList(conversionList.map(c => c.id === updated.id ? updated : c));
        setIsEditConvModalOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteConv = async () => {
    if (!deleteConvId) return;
    try {
      const res = await fetch(`/api/conversions/${deleteConvId}`, { method: 'DELETE', headers: { 'x-actor': userName } });
      if (res.ok) {
        setConversionList(conversionList.filter(c => c.id !== deleteConvId));
        setIsDeleteConvModalOpen(false);
        setDeleteConvId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPatient = async () => {
    try {
      const res = await fetch('/api/patients', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPatientForm)
      });
      if (res.ok) {
        const added = await res.json();
        setPatientList([...patientList, added]);
        setNewPatientForm({ nik: "", name: "", address: "" });
        setIsAddPatientModalOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditPatient = async () => {
    if (!editPatientForm.id) return;
    try {
      const res = await fetch(`/api/patients/${editPatientForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editPatientForm)
      });
      if (res.ok) {
        const updated = await res.json();
        setPatientList(patientList.map(p => p.id === updated.id ? updated : p));
        setIsEditPatientModalOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePatient = async () => {
    if (!deletePatientId) return;
    try {
      const res = await fetch(`/api/patients/${deletePatientId}`, { method: "DELETE" });
      if (res.ok) {
        setPatientList(patientList.filter(p => p.id !== deletePatientId));
        setIsDeletePatientModalOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAccount = async () => {
    try {
      const res = await fetch('/api/accounts', {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(newAccountForm)
      });
      if (res.ok) {
        const added = await res.json();
        setAccountList([...accountList, added]);
        setNewAccountForm({ name: "", role: "Staff", username: "", password: "" });
        setIsAddAccountModalOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditAccount = async () => {
    if (!editAccountForm.id) return;
    try {
      const res = await fetch(`/api/accounts/${editAccountForm.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ 
          name: editAccountForm.name, 
          role: editAccountForm.role,
          username: editAccountForm.username,
          password: editAccountForm.password 
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setAccountList(accountList.map(a => a.id === updated.id ? updated : a));
        setIsEditAccountModalOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccountId) return;
    try {
      const res = await fetch(`/api/accounts/${deleteAccountId}`, { method: 'DELETE', headers: { 'x-actor': userName } });
      if (res.ok) {
        setAccountList(accountList.filter(a => a.id !== deleteAccountId));
        setIsDeleteAccountModalOpen(false);
        setDeleteAccountId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddDrug = async () => {
    try {
      const res = await fetch('/api/inventory', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDrugForm)
      });
      if (res.ok) {
        const added = await res.json();
        setInventoryList([...inventoryList, added]);
        setNewDrugForm({ name: "", type: "Tablet" });
        setIsAddDrugModalOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditDrug = async () => {
    if (!editDrugForm.id) return;
    try {
      const res = await fetch(`/api/inventory/${editDrugForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editDrugForm.name, type: editDrugForm.type })
      });
      if (res.ok) {
        const updated = await res.json();
        setInventoryList(inventoryList.map(d => d.id === updated.id ? updated : d));
        setIsEditDrugModalOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteDrug = async () => {
    if (!deleteDrugId) return;
    try {
      const res = await fetch(`/api/inventory/${deleteDrugId}`, { method: 'DELETE' });
      if (res.ok) {
        setInventoryList(inventoryList.filter(d => d.id !== deleteDrugId));
        setIsDeleteDrugModalOpen(false);
        setDeleteDrugId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPbf = async () => {
    try {
      const res = await fetch('/api/pbf', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPbfForm)
      });
      if (res.ok) {
        const added = await res.json();
        setPbfList([...pbfList, added]);
        setIsAddPbfModalOpen(false);
        setNewPbfForm({ name: "", sales: "", phone: "", license: "", address: "" });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openEditPbfModal = (pbf: any) => {
    setEditPbfForm(pbf);
    setIsEditPbfModalOpen(true);
  };

  const handleEditPbf = async () => {
    try {
      const res = await fetch(`/api/pbf/${editPbfForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editPbfForm)
      });
      if (res.ok) {
        const updated = await res.json();
        setPbfList(pbfList.map(p => p.id === updated.id ? updated : p));
        setIsEditPbfModalOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [deletePbfId, setDeletePbfId] = useState<string | null>(null);

  const handleDeletePbf = async () => {
    if (!deletePbfId) return;
    try {
      const res = await fetch(`/api/pbf/${deletePbfId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setPbfList(pbfList.filter(p => p.id !== deletePbfId));
        setDeletePbfId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isManager && !isPengelola) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="flex bg-surface min-h-screen relative">
      <SideNavBar />
      <MobileHeader title="Settings" />
      <main className="flex-1 md:ml-64 flex flex-col items-center p-4 min-h-screen w-full mb-16 md:mb-0 pt-[calc(1rem+4rem+env(safe-area-inset-top))] md:pt-4">
        <div className="w-full max-w-5xl">
          <header className="mb-6">
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-2">System Settings</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Manage configurations, accounts, and master data.</p>
          </header>

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[600px]">
            {/* Sidebar Tabs */}
            <div className="w-full lg:w-64 bg-surface-muted border-b lg:border-b-0 lg:border-r border-outline-variant p-4 flex flex-row lg:flex-col gap-2 overflow-x-auto shrink-0">
              <button 
                onClick={() => setActiveTab("accounts")}
                className={`whitespace-nowrap flex items-center gap-2 px-4 py-3 rounded-lg text-left transition-colors font-medium text-sm ${activeTab === "accounts" ? "bg-primary-container text-primary border border-primary/20" : "text-on-surface-variant hover:bg-surface-container"}`}
              >
                <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                Account Mgt
              </button>
              {isManager && (
                <button 
                  onClick={() => setActiveTab("targets")}
                  className={`whitespace-nowrap flex items-center gap-2 px-4 py-3 rounded-lg text-left transition-colors font-medium text-sm ${activeTab === "targets" ? "bg-primary-container text-primary border border-primary/20" : "text-on-surface-variant hover:bg-surface-container"}`}
                >
                  <span className="material-symbols-outlined text-[20px]">ads_click</span>
                  Targets
                </button>
              )}
              <button 
                onClick={() => setActiveTab("patients")}
                className={`whitespace-nowrap flex items-center gap-2 px-4 py-3 rounded-lg text-left transition-colors font-medium text-sm ${activeTab === "patients" ? "bg-primary-container text-primary border border-primary/20" : "text-on-surface-variant hover:bg-surface-container"}`}
              >
                <span className="material-symbols-outlined text-[20px]">recent_patient</span>
                Patient DB
              </button>
              <button 
                onClick={() => setActiveTab("drugs")}
                className={`whitespace-nowrap flex items-center gap-2 px-4 py-3 rounded-lg text-left transition-colors font-medium text-sm ${activeTab === "drugs" ? "bg-primary-container text-primary border border-primary/20" : "text-on-surface-variant hover:bg-surface-container"}`}
              >
                <span className="material-symbols-outlined text-[20px]">medication</span>
                Drug Settings & QTY
              </button>
              <button 
                onClick={() => setActiveTab("pbf")}
                className={`whitespace-nowrap flex items-center gap-2 px-4 py-3 rounded-lg text-left transition-colors font-medium text-sm ${activeTab === "pbf" ? "bg-primary-container text-primary border border-primary/20" : "text-on-surface-variant hover:bg-surface-container"}`}
              >
                <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                PBF / Vendors
              </button>
              <button 
                onClick={() => setActiveTab("embalase")}
                className={`whitespace-nowrap flex items-center gap-2 px-4 py-3 rounded-lg text-left transition-colors font-medium text-sm ${activeTab === "embalase" ? "bg-primary-container text-primary border border-primary/20" : "text-on-surface-variant hover:bg-surface-container"}`}
              >
                <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                Embalase / Packaging
              </button>
              {isManager && (
                <button 
                  onClick={() => setActiveTab("audit")}
                  className={`whitespace-nowrap flex items-center gap-2 px-4 py-3 rounded-lg text-left transition-colors font-medium text-sm ${activeTab === "audit" ? "bg-primary-container text-primary border border-primary/20" : "text-on-surface-variant hover:bg-surface-container"}`}
                >
                  <span className="material-symbols-outlined text-[20px]">history</span>
                  Audit Trail
                </button>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 overflow-y-auto">
              
              {activeTab === "patients" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-outline-variant">
                    <div>
                      <h2 className="text-xl font-bold text-on-surface">Patient Database</h2>
                      <p className="text-sm text-on-surface-variant opacity-80 mt-1">
                        Manage patient data from POS and Prescriptions.
                      </p>
                    </div>
                    <button onClick={() => setIsAddPatientModalOpen(true)} className="px-4 py-2 bg-primary text-on-primary rounded font-bold text-sm tracking-widest flex items-center gap-2 hover:bg-primary-fixed transition-colors">
                      <span className="material-symbols-outlined text-[18px]">person_add</span>
                      Add Patient
                    </button>
                  </div>
                  
                  <div className="bg-surface-container-low border border-outline-variant rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead className="bg-surface-muted text-on-surface-variant font-bold border-b border-outline-variant uppercase text-xs tracking-wider">
                        <tr>
                          <th className="p-4">NIK</th>
                          <th className="p-4">Patient Name</th>
                          <th className="p-4">Address</th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                        {patientList.map((patient: any, idx: number) => (
                          <tr key={patient.id || idx} className="hover:bg-surface-muted transition-colors">
                            <td className="p-4 font-medium text-primary font-data-mono">{patient.nik}</td>
                            <td className="p-4 text-on-surface">{patient.name}</td>
                            <td className="p-4 text-on-surface-variant max-w-xs truncate">{patient.address}</td>
                            <td className="p-4 text-center">
                              <button onClick={() => { setEditPatientForm({ id: patient.id, nik: patient.nik, name: patient.name, address: patient.address }); setIsEditPatientModalOpen(true); }} className="p-1.5 hover:bg-surface-variant text-primary rounded mr-2" title="Edit">
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                              </button>
                              <button onClick={() => { setDeletePatientId(patient.id); setIsDeletePatientModalOpen(true); }} className="p-1.5 hover:bg-error-container text-regulatory-alert rounded" title="Delete">
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "accounts" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-outline-variant">
                    <div>
                      <h2 className="text-xl font-bold text-on-surface">Account Management</h2>
                      <p className="text-sm text-on-surface-variant opacity-80 mt-1">
                        Manage Staff accounts for this branch.
                      </p>
                    </div>
                    <button onClick={() => setIsAddAccountModalOpen(true)} className="px-4 py-2 bg-primary text-on-primary rounded font-bold text-sm tracking-widest flex items-center gap-2 hover:bg-primary-fixed transition-colors">
                      <span className="material-symbols-outlined text-[18px]">person_add</span>
                      Add Account
                    </button>
                  </div>
                  
                  <div className="bg-surface-container-low border border-outline-variant rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead className="bg-surface-muted text-on-surface-variant font-bold border-b border-outline-variant uppercase text-xs tracking-wider">
                        <tr>
                          <th className="p-4">Name / ID</th>
                          <th className="p-4">Role</th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                        {accountList.map((acc) => (
                          <tr key={acc.id} className="hover:bg-surface-muted transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-on-surface">{acc.name}</div>
                              <div className="text-xs text-on-surface-variant font-mono">ID: {acc.id} • Username: {acc.username}</div>
                            </td>
                            <td className="p-4"><span className="px-2 py-1 bg-secondary-container text-on-surface font-bold text-[10px] uppercase rounded border border-outline-variant text-[10px]">{acc.role}</span></td>
                            <td className="p-4 text-center">
                              <button onClick={() => { setEditAccountForm({ id: acc.id, name: acc.name, role: acc.role, username: acc.username || "", password: "" }); setIsEditAccountModalOpen(true); }} className="p-1.5 hover:bg-surface-variant text-primary rounded transition-colors mx-1" title="Edit">
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button onClick={() => { setDeleteAccountId(acc.id); setIsDeleteAccountModalOpen(true); }} className="p-1.5 hover:bg-error-container text-regulatory-alert rounded transition-colors mx-1" title="Delete">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "targets" && isManager && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-outline-variant">
                    <div>
                      <h2 className="text-xl font-bold text-on-surface">Target Settings</h2>
                      <p className="text-sm text-on-surface-variant opacity-80 mt-1">
                        Set revenue targets for different periods to display in analytics.
                      </p>
                    </div>
                    <button onClick={handleSaveTargets} disabled={isSavingTargets} className="px-4 py-2 bg-primary text-on-primary rounded font-bold text-sm tracking-widest flex items-center gap-2 hover:bg-primary-fixed transition-colors disabled:opacity-50">
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      {isSavingTargets ? "Saving..." : "Save Targets"}
                    </button>
                  </div>
                  <div className="max-w-xl space-y-4">
                    <div>
                      <label className="block font-bold text-on-surface mb-2">Target Shift</label>
                      <input 
                        type="number" 
                        value={targetSettings.shift}
                        onChange={e => setTargetSettings({...targetSettings, shift: Number(e.target.value)})}
                        className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors" 
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-on-surface mb-2">Target 1 Hari</label>
                      <input 
                        type="number" 
                        value={targetSettings.day}
                        onChange={e => setTargetSettings({...targetSettings, day: Number(e.target.value)})}
                        className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors" 
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-on-surface mb-2">Target 1 Bulan</label>
                      <input 
                        type="number" 
                        value={targetSettings.month}
                        onChange={e => setTargetSettings({...targetSettings, month: Number(e.target.value)})}
                        className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors" 
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-on-surface mb-2">Target 3 Bulan</label>
                      <input 
                        type="number" 
                        value={targetSettings.quarter}
                        onChange={e => setTargetSettings({...targetSettings, quarter: Number(e.target.value)})}
                        className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors" 
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-on-surface mb-2">Target Tahun</label>
                      <input 
                        type="number" 
                        value={targetSettings.year}
                        onChange={e => setTargetSettings({...targetSettings, year: Number(e.target.value)})}
                        className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "drugs" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-outline-variant">
                    <div>
                      <h2 className="text-xl font-bold text-on-surface">Drug & QTY Settings</h2>
                      <p className="text-sm text-on-surface-variant opacity-80 mt-1">Manage master drug list and unit conversions (e.g. Box to Strip to Tab).</p>
                    </div>
                    <button onClick={() => setIsAddDrugModalOpen(true)} className="px-4 py-2 bg-primary text-on-primary rounded font-bold text-sm tracking-widest flex items-center gap-2 hover:bg-primary-fixed transition-colors">
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Add Drug Master
                    </button>
                  </div>
                  
                  <div className="bg-surface-container-low border border-outline-variant rounded-lg p-5">
                    <h3 className="font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant">Standardized QTY Conversions</h3>
                    <div className="space-y-4">
                      {conversionList.map((conv, idx) => (
                        <div key={conv.id || idx} className="flex items-center gap-4 bg-surface-muted p-3 rounded border border-outline-variant">
                          <span className="font-bold text-primary w-20">{conv.name}</span>
                          <span className="text-on-surface text-sm">{conv.rule}</span>
                          <div className="ml-auto flex gap-2">
                            <button onClick={() => { setEditConvForm({ id: conv.id, name: conv.name, besar: conv.besar || "", sedang: conv.sedang || "", sedang_qty: conv.sedang_qty || "", kecil: conv.kecil || "", kecil_qty: conv.kecil_qty || "" }); setIsEditConvModalOpen(true); }} className="p-1.5 hover:bg-surface-variant text-primary rounded"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                            <button onClick={() => { setDeleteConvId(conv.id); setIsDeleteConvModalOpen(true); }} className="p-1.5 hover:bg-error-container text-regulatory-alert rounded"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => setIsAddConvModalOpen(true)} className="mt-2 text-sm text-primary font-bold hover:underline">+ Add New Conversion Rule</button>
                    </div>
                  </div>

                  <div className="bg-surface-container-low border border-outline-variant rounded-lg overflow-hidden mt-6">
                    <div className="p-4 bg-surface-muted border-b border-outline-variant flex justify-between items-center">
                      <h3 className="font-bold text-on-surface">Master Drug List</h3>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">search</span>
                        <input 
                          type="text" 
                          placeholder="Search..." 
                          value={searchDrug} 
                          onChange={(e) => setSearchDrug(e.target.value)}
                          className="pl-8 pr-3 py-1 bg-surface-container-lowest border border-outline-variant rounded text-sm focus:outline-none focus:border-primary" 
                        />
                      </div>
                    </div>
                    <table className="w-full text-left text-sm">
                      <tbody className="divide-y divide-outline-variant">
                        {inventoryList.filter(d => d.name.toLowerCase().includes(searchDrug.toLowerCase())).map((drug, i) => (
                          <tr key={drug.id || i} className="hover:bg-surface-muted transition-colors">
                            <td className="p-3 font-medium text-on-surface">
                              {drug.name}
                            </td>
                            <td className="p-3 text-on-surface-variant text-xs">
                              <span className="px-2 py-0.5 bg-surface-muted border border-outline-variant rounded font-mono text-[10px] mr-2">
                                {drug.type || "Tablet"}
                              </span>
                              SKU: {drug.id}
                            </td>
                            <td className="p-3 text-right">
                              <button onClick={() => { setEditDrugForm({ id: drug.id, name: drug.name, type: drug.type || "Tablet" }); setIsEditDrugModalOpen(true); }} className="p-1 hover:bg-surface-variant text-primary rounded mx-1" title="Edit"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                              <button onClick={() => { setDeleteDrugId(drug.id); setIsDeleteDrugModalOpen(true); }} className="p-1 hover:bg-error-container text-regulatory-alert rounded mx-1" title="Delete"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "pbf" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-outline-variant">
                    <div>
                      <h2 className="text-xl font-bold text-on-surface">PBF / Vendor Management</h2>
                      <p className="text-sm text-on-surface-variant opacity-80 mt-1">Manage suppliers, vendors, and PBF (Pedagang Besar Farmasi).</p>
                    </div>
                    <button onClick={() => setIsAddPbfModalOpen(true)} className="px-4 py-2 bg-primary text-on-primary rounded font-bold text-sm tracking-widest flex items-center gap-2 hover:bg-primary-fixed transition-colors">
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Add PBF
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pbfList.map((pbf, idx) => (
                      <div key={pbf.id || idx} className="bg-surface-container-low border border-outline-variant p-4 rounded-lg flex flex-col hover:border-primary/50 transition-colors">
                        <h4 className="font-bold text-on-surface mb-1">{pbf.name}</h4>
                        <p className="text-xs text-on-surface-variant font-mono">ID: {pbf.id || `VEND-20${idx+1}`}</p>
                        <div className="mt-4 pt-4 border-t border-outline-variant flex justify-between items-center">
                          <span className="px-2 py-0.5 bg-primary-container text-primary text-[10px] uppercase font-bold rounded border border-primary/20">Approved Vendor</span>
                          <div className="flex gap-2">
                            <button onClick={() => openEditPbfModal(pbf)} className="p-1.5 bg-surface-muted hover:bg-surface-variant border border-outline-variant text-primary rounded transition-colors" title="Edit">
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                            <button onClick={() => pbf.id && setDeletePbfId(pbf.id)} className="p-1.5 bg-surface-muted hover:bg-error-container border border-outline-variant hover:border-regulatory-alert text-regulatory-alert rounded transition-colors" title="Delete">
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "audit" && isManager && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-outline-variant">
                    <div>
                      <h2 className="text-xl font-bold text-on-surface">Audit Trail</h2>
                      <p className="text-sm text-on-surface-variant opacity-80 mt-1">
                        Aktivitas log mendetail tentang perubahan krusial di sistem.
                      </p>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface">
                    <table className="w-full text-left border-collapse font-body-md text-sm">
                      <thead>
                        <tr className="bg-surface-muted text-on-surface-variant border-b border-outline-variant/60 uppercase tracking-wider text-xs">
                          <th className="p-4 font-bold w-48">Waktu</th>
                          <th className="p-4 font-bold w-48">Aktor</th>
                          <th className="p-4 font-bold w-48">Tindakan</th>
                          <th className="p-4 font-bold leading-relaxed">Rincian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/60">
                        {auditLogs.length > 0 ? (
                           auditLogs.map((log: any) => (
                             <tr key={log.id} className="hover:bg-surface-muted/50 transition-colors">
                               <td className="p-4 font-mono font-medium text-xs text-on-surface-variant">
                                 {new Date(log.timestamp).toLocaleString('id-ID', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}
                               </td>
                               <td className="p-4 font-bold text-primary">{log.actor}</td>
                               <td className="p-4 font-data-mono">{log.action}</td>
                               <td className="p-4 text-on-surface">{log.detail}</td>
                             </tr>
                           ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-on-surface-variant">
                              Tidak ada history audit log.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "embalase" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-outline-variant">
                    <div>
                      <h2 className="text-xl font-bold text-on-surface">Embalase / Kemasan Settings</h2>
                      <p className="text-sm text-on-surface-variant opacity-80 mt-1">Manage packaging options (Embalase) and their prices for prescriptions.</p>
                    </div>
                    <button onClick={() => setIsAddEmbalaseModalOpen(true)} className="px-4 py-2 bg-primary text-on-primary rounded font-bold text-sm tracking-widest flex items-center gap-2 hover:bg-primary-fixed transition-colors">
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Add Embalase
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {embalaseList.map((emb, idx) => (
                      <div key={emb.id || idx} className="bg-surface-container-low border border-outline-variant p-4 rounded-lg flex justify-between items-center hover:border-primary/50 transition-colors">
                        <div>
                           <h4 className="font-bold text-on-surface mb-1">{emb.name}</h4>
                           <p className="text-sm text-primary font-data-mono font-bold">Rp {emb.price.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* Add Embalase Modal */}
      {isAddEmbalaseModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-xl flex flex-col border border-outline-variant">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-muted rounded-t-2xl">
              <h2 className="font-headline-md font-bold text-on-surface">Tambah Embalase Baru</h2>
              <button onClick={() => setIsAddEmbalaseModalOpen(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-1">Nama Kemasan / Embalase</label>
                <input 
                  type="text" 
                  value={newEmbalaseForm.name} 
                  onChange={e => setNewEmbalaseForm({...newEmbalaseForm, name: e.target.value})}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 focus:outline-none focus:border-primary" 
                  placeholder="e.g. Kertas Puyer" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-1">Harga (Rp)</label>
                <input 
                  type="number" 
                  value={newEmbalaseForm.price} 
                  onChange={e => setNewEmbalaseForm({...newEmbalaseForm, price: Number(e.target.value)})}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 focus:outline-none focus:border-primary" 
                  placeholder="e.g. 2000" 
                />
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant bg-surface-muted rounded-b-2xl flex justify-end gap-3">
              <button onClick={() => setIsAddEmbalaseModalOpen(false)} className="px-5 py-2 font-bold text-on-surface-variant hover:bg-surface-variant rounded transition-colors">Batal</button>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/embalase', {
                      method: 'POST',
                      headers: getHeaders(),
                      body: JSON.stringify(newEmbalaseForm)
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setEmbalaseList([...embalaseList, data]);
                      setNewEmbalaseForm({ name: "", price: 0 });
                      setIsAddEmbalaseModalOpen(false);
                    }
                  } catch(e) {
                     console.error("Gagal tambah embalase");
                  }
                }} 
                className="px-5 py-2 bg-primary text-on-primary font-bold rounded hover:bg-primary-fixed transition-colors"
               >
                 Simpan
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Add PBF Modal */}
      {isAddPbfModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-xl flex flex-col border border-outline-variant">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-muted rounded-t-2xl">
              <h2 className="font-headline-md font-bold text-on-surface">Tambah PBF Baru</h2>
              <button onClick={() => setIsAddPbfModalOpen(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Nama PBF <span className="text-regulatory-alert">*</span></label>
                <input type="text" value={newPbfForm.name} onChange={(e) => setNewPbfForm({...newPbfForm, name: e.target.value})} className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant rounded focus:outline-none focus:border-primary" placeholder="Masukkan nama PBF..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Nama Sales</label>
                <input type="text" value={newPbfForm.sales} onChange={(e) => setNewPbfForm({...newPbfForm, sales: e.target.value})} className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant rounded focus:outline-none focus:border-primary" placeholder="Nama representatif sales..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Nomor Telepon PBF <span className="text-regulatory-alert">*</span></label>
                <input type="text" value={newPbfForm.phone} onChange={(e) => setNewPbfForm({...newPbfForm, phone: e.target.value})} className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant rounded focus:outline-none focus:border-primary" placeholder="021-XXXXXXX" />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Nomor Izin PBF</label>
                <input type="text" value={newPbfForm.license} onChange={(e) => setNewPbfForm({...newPbfForm, license: e.target.value})} className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant rounded focus:outline-none focus:border-primary" placeholder="Masukkan No. Izin..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Alamat PBF <span className="text-regulatory-alert">*</span></label>
                <textarea value={newPbfForm.address} onChange={(e) => setNewPbfForm({...newPbfForm, address: e.target.value})} className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded focus:outline-none focus:border-primary shrink-0 min-h-[80px]" placeholder="Alamat lengkap PBF..."></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant flex justify-end gap-3 bg-surface-muted rounded-b-2xl mt-auto">
               <button onClick={() => setIsAddPbfModalOpen(false)} className="px-4 py-2 border border-outline-variant text-on-surface rounded font-bold text-sm hover:bg-surface-variant transition-colors">Batal</button>
               <button onClick={handleAddPbf} disabled={!newPbfForm.name} className="px-6 py-2 bg-primary disabled:opacity-50 text-on-primary rounded font-bold text-sm tracking-widest hover:bg-primary-fixed transition-colors">Simpan PBF</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Drug Master Modal */}
      {isAddDrugModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-xl flex flex-col border border-outline-variant">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-muted rounded-t-2xl">
              <h2 className="font-headline-md font-bold text-on-surface">Tambah Master Obat</h2>
              <button onClick={() => setIsAddDrugModalOpen(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block font-bold text-on-surface mb-2">Nama Barang / Obat</label>
                <input 
                  type="text" 
                  value={newDrugForm.name} 
                  onChange={e => setNewDrugForm({...newDrugForm, name: e.target.value})} 
                  className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors" 
                  placeholder="Contoh: Paracetamol 500mg" 
                />
              </div>
              <div>
                <label className="block font-bold text-on-surface mb-2">Jenis Barang (Bentuk Sediaan)</label>
                <select 
                  value={newDrugForm.type} 
                  onChange={e => setNewDrugForm({...newDrugForm, type: e.target.value})} 
                  className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors"
                >
                  <option value="Tablet">Tablet</option>
                  <option value="Sirup">Sirup</option>
                  <option value="Tube">Tube</option>
                  <option value="Kapsul">Kapsul</option>
                  <option value="Suppositoria">Suppositoria</option>
                  <option value="Tetes">Tetes (Drop)</option>
                  <option value="Injeksi">Injeksi / Vial</option>
                  <option value="Alkes">Alat Kesehatan</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant flex justify-end gap-3 bg-surface-muted rounded-b-2xl mt-auto">
               <button onClick={() => setIsAddDrugModalOpen(false)} className="px-4 py-2 border border-outline-variant text-on-surface rounded font-bold text-sm hover:bg-surface-variant transition-colors">Batal</button>
               <button onClick={handleAddDrug} disabled={!newDrugForm.name} className="px-6 py-2 bg-primary disabled:opacity-50 text-on-primary rounded font-bold text-sm tracking-widest hover:bg-primary-fixed transition-colors">Simpan Obat</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Drug Master Modal */}
      {isEditDrugModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-xl flex flex-col border border-outline-variant">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-muted rounded-t-2xl">
              <h2 className="font-headline-md font-bold text-on-surface">Edit Master Obat</h2>
              <button onClick={() => setIsEditDrugModalOpen(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block font-bold text-on-surface mb-2">Nama Barang / Obat</label>
                <input 
                  type="text" 
                  value={editDrugForm.name} 
                  onChange={e => setEditDrugForm({...editDrugForm, name: e.target.value})} 
                  className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors" 
                  placeholder="Contoh: Paracetamol 500mg" 
                />
              </div>
              <div>
                <label className="block font-bold text-on-surface mb-2">Jenis Barang (Bentuk Sediaan)</label>
                <select 
                  value={editDrugForm.type} 
                  onChange={e => setEditDrugForm({...editDrugForm, type: e.target.value})} 
                  className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors"
                >
                  <option value="Tablet">Tablet</option>
                  <option value="Sirup">Sirup</option>
                  <option value="Tube">Tube</option>
                  <option value="Kapsul">Kapsul</option>
                  <option value="Suppositoria">Suppositoria</option>
                  <option value="Tetes">Tetes (Drop)</option>
                  <option value="Injeksi">Injeksi / Vial</option>
                  <option value="Alkes">Alat Kesehatan</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant flex justify-end gap-3 bg-surface-muted rounded-b-2xl mt-auto">
               <button onClick={() => setIsEditDrugModalOpen(false)} className="px-4 py-2 border border-outline-variant text-on-surface rounded font-bold text-sm hover:bg-surface-variant transition-colors">Batal</button>
               <button onClick={handleEditDrug} disabled={!editDrugForm.name} className="px-6 py-2 bg-primary disabled:opacity-50 text-on-primary rounded font-bold text-sm tracking-widest hover:bg-primary-fixed transition-colors">Update Obat</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Drug Modal Confirmation */}
      {isDeleteDrugModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl shadow-xl flex flex-col border border-regulatory-alert">
            <div className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-[32px] text-regulatory-alert">warning</span>
              </div>
              <h2 className="font-headline-md font-bold text-on-surface">Konfirmasi Hapus</h2>
              <p className="text-on-surface-variant text-sm">
                Apakah Anda yakin ingin menghapus obat ini dari Master Drug List? Data yang dihapus tidak dapat dikembalikan.
              </p>
            </div>
            <div className="p-6 border-t border-outline-variant flex justify-center gap-3 bg-surface-muted rounded-b-2xl">
               <button onClick={() => { setIsDeleteDrugModalOpen(false); setDeleteDrugId(null); }} className="px-6 py-2 border border-outline-variant text-on-surface rounded font-bold text-sm hover:bg-surface-variant transition-colors flex-1">Batal</button>
               <button onClick={handleDeleteDrug} className="px-6 py-2 bg-regulatory-alert text-white rounded font-bold text-sm tracking-widest hover:bg-[#c9302c] transition-colors flex-1">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Add QTY Conversion Modal */}
      {isAddConvModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-xl flex flex-col border border-outline-variant">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-muted rounded-t-2xl">
              <h2 className="font-headline-md font-bold text-on-surface">Tambah Aturan Konversi QTY</h2>
              <button onClick={() => setIsAddConvModalOpen(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block font-bold text-on-surface mb-2">Nama Tipe Konversi</label>
                <input 
                  type="text" 
                  value={newConvForm.name} 
                  onChange={e => setNewConvForm({...newConvForm, name: e.target.value})} 
                  className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors" 
                  placeholder="Contoh: Type Box ke Tablet" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-on-surface mb-2">Satuan Besar (1)</label>
                  <input 
                    type="text"
                    value={newConvForm.besar} 
                    onChange={e => setNewConvForm({...newConvForm, besar: e.target.value})} 
                    className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors"
                    placeholder="misal: Box"
                  />
                </div>
              </div>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block font-bold text-on-surface mb-2">Jumlah per Satuan 1</label>
                  <input 
                    type="number"
                    value={newConvForm.sedang_qty} 
                    onChange={e => setNewConvForm({...newConvForm, sedang_qty: e.target.value})} 
                    className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors"
                    placeholder="misal: 10"
                  />
                </div>
                <div className="flex-1">
                  <label className="block font-bold text-on-surface mb-2">Satuan Sedang/Sedang (2)</label>
                  <input 
                    type="text"
                    value={newConvForm.sedang} 
                    onChange={e => setNewConvForm({...newConvForm, sedang: e.target.value})} 
                    className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors"
                    placeholder="misal: Strip"
                  />
                </div>
              </div>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block font-bold text-on-surface mb-2">Jlh per Satuan 2 (Opsional)</label>
                  <input 
                    type="number"
                    value={newConvForm.kecil_qty} 
                    onChange={e => setNewConvForm({...newConvForm, kecil_qty: e.target.value})} 
                    className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors"
                    placeholder="misal: 10"
                  />
                </div>
                <div className="flex-1">
                  <label className="block font-bold text-on-surface mb-2">Satuan Terkecil (Opsional)</label>
                  <input 
                    type="text"
                    value={newConvForm.kecil} 
                    onChange={e => setNewConvForm({...newConvForm, kecil: e.target.value})} 
                    className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors"
                    placeholder="misal: Tablet"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant flex justify-end gap-3 bg-surface-muted rounded-b-2xl mt-auto">
               <button onClick={() => setIsAddConvModalOpen(false)} className="px-4 py-2 border border-outline-variant text-on-surface rounded font-bold text-sm hover:bg-surface-variant transition-colors">Batal</button>
               <button onClick={handleAddConv} disabled={!newConvForm.name || !newConvForm.besar || !newConvForm.sedang} className="px-6 py-2 bg-primary disabled:opacity-50 text-on-primary rounded font-bold text-sm tracking-widest hover:bg-primary-fixed transition-colors">Simpan Konversi</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit QTY Conversion Modal */}
      {isEditConvModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-xl flex flex-col border border-outline-variant">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-muted rounded-t-2xl">
              <h2 className="font-headline-md font-bold text-on-surface">Edit Aturan Konversi QTY</h2>
              <button onClick={() => setIsEditConvModalOpen(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block font-bold text-on-surface mb-2">Nama Tipe Konversi</label>
                <input 
                  type="text" 
                  value={editConvForm.name} 
                  onChange={e => setEditConvForm({...editConvForm, name: e.target.value})} 
                  className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors" 
                  placeholder="Contoh: Type Box ke Tablet" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-on-surface mb-2">Satuan Besar (1)</label>
                  <input 
                    type="text"
                    value={editConvForm.besar || ""} 
                    onChange={e => setEditConvForm({...editConvForm, besar: e.target.value})} 
                    className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors"
                    placeholder="misal: Box"
                  />
                </div>
              </div>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block font-bold text-on-surface mb-2">Jumlah per Satuan 1</label>
                  <input 
                    type="number"
                    value={editConvForm.sedang_qty || ""} 
                    onChange={e => setEditConvForm({...editConvForm, sedang_qty: e.target.value})} 
                    className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors"
                    placeholder="misal: 10"
                  />
                </div>
                <div className="flex-1">
                  <label className="block font-bold text-on-surface mb-2">Satuan Sedang/Sedang (2)</label>
                  <input 
                    type="text"
                    value={editConvForm.sedang || ""} 
                    onChange={e => setEditConvForm({...editConvForm, sedang: e.target.value})} 
                    className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors"
                    placeholder="misal: Strip"
                  />
                </div>
              </div>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block font-bold text-on-surface mb-2">Jlh per Satuan 2 (Opsional)</label>
                  <input 
                    type="number"
                    value={editConvForm.kecil_qty || ""} 
                    onChange={e => setEditConvForm({...editConvForm, kecil_qty: e.target.value})} 
                    className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors"
                    placeholder="misal: 10"
                  />
                </div>
                <div className="flex-1">
                  <label className="block font-bold text-on-surface mb-2">Satuan Terkecil (Opsional)</label>
                  <input 
                    type="text"
                    value={editConvForm.kecil || ""} 
                    onChange={e => setEditConvForm({...editConvForm, kecil: e.target.value})} 
                    className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors"
                    placeholder="misal: Tablet"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant flex justify-end gap-3 bg-surface-muted rounded-b-2xl mt-auto">
               <button onClick={() => setIsEditConvModalOpen(false)} className="px-4 py-2 border border-outline-variant text-on-surface rounded font-bold text-sm hover:bg-surface-variant transition-colors">Batal</button>
               <button onClick={handleEditConv} disabled={!editConvForm.name || !editConvForm.besar || !editConvForm.sedang} className="px-6 py-2 bg-primary disabled:opacity-50 text-on-primary rounded font-bold text-sm tracking-widest hover:bg-primary-fixed transition-colors">Update Konversi</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete QTY Conversion Modal Confirmation */}
      {isDeleteConvModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl shadow-xl flex flex-col border border-regulatory-alert">
            <div className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-[32px] text-regulatory-alert">warning</span>
              </div>
              <h2 className="font-headline-md font-bold text-on-surface">Konfirmasi Hapus</h2>
              <p className="text-on-surface-variant text-sm">
                Apakah Anda yakin ingin menghapus aturan konversi QTY ini?
              </p>
            </div>
            <div className="p-6 border-t border-outline-variant flex justify-center gap-3 bg-surface-muted rounded-b-2xl">
               <button onClick={() => { setIsDeleteConvModalOpen(false); setDeleteConvId(null); }} className="px-6 py-2 border border-outline-variant text-on-surface rounded font-bold text-sm hover:bg-surface-variant transition-colors flex-1">Batal</button>
               <button onClick={handleDeleteConv} className="px-6 py-2 bg-regulatory-alert text-white rounded font-bold text-sm tracking-widest hover:bg-[#c9302c] transition-colors flex-1">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Patient Modal */}
      {isAddPatientModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-xl flex flex-col border border-outline-variant">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-muted rounded-t-2xl">
              <h2 className="font-headline-md font-bold text-on-surface">Add Patient</h2>
              <button onClick={() => setIsAddPatientModalOpen(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block font-bold text-on-surface mb-2">Patient NIK</label>
                <input type="text" value={newPatientForm.nik} onChange={e => setNewPatientForm({...newPatientForm, nik: e.target.value})} className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors" placeholder="16-digit NIK" />
              </div>
              <div>
                <label className="block font-bold text-on-surface mb-2">Patient Name</label>
                <input type="text" value={newPatientForm.name} onChange={e => setNewPatientForm({...newPatientForm, name: e.target.value})} className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors" placeholder="Full Name" />
              </div>
              <div>
                <label className="block font-bold text-on-surface mb-2">Address</label>
                <textarea value={newPatientForm.address} onChange={e => setNewPatientForm({...newPatientForm, address: e.target.value})} className="w-full p-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors" rows={3} placeholder="Full Address"></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant flex justify-end gap-3 bg-surface-muted rounded-b-2xl mt-auto">
               <button onClick={() => setIsAddPatientModalOpen(false)} className="px-4 py-2 border border-outline-variant text-on-surface rounded font-bold text-sm hover:bg-surface-variant transition-colors">Cancel</button>
               <button onClick={handleAddPatient} disabled={!newPatientForm.name || !newPatientForm.nik} className="px-6 py-2 bg-primary disabled:opacity-50 text-on-primary rounded font-bold text-sm tracking-widest hover:bg-primary-fixed transition-colors">Save Patient</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {isEditPatientModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-xl flex flex-col border border-outline-variant">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-muted rounded-t-2xl">
              <h2 className="font-headline-md font-bold text-on-surface">Edit Patient</h2>
              <button onClick={() => setIsEditPatientModalOpen(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block font-bold text-on-surface mb-2">Patient NIK</label>
                <input type="text" value={editPatientForm.nik} onChange={e => setEditPatientForm({...editPatientForm, nik: e.target.value})} className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors" />
              </div>
              <div>
                <label className="block font-bold text-on-surface mb-2">Patient Name</label>
                <input type="text" value={editPatientForm.name} onChange={e => setEditPatientForm({...editPatientForm, name: e.target.value})} className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors" />
              </div>
              <div>
                <label className="block font-bold text-on-surface mb-2">Address</label>
                <textarea value={editPatientForm.address} onChange={e => setEditPatientForm({...editPatientForm, address: e.target.value})} className="w-full p-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors" rows={3}></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant flex justify-end gap-3 bg-surface-muted rounded-b-2xl mt-auto">
               <button onClick={() => setIsEditPatientModalOpen(false)} className="px-4 py-2 border border-outline-variant text-on-surface rounded font-bold text-sm hover:bg-surface-variant transition-colors">Cancel</button>
               <button onClick={handleEditPatient} disabled={!editPatientForm.name || !editPatientForm.nik} className="px-6 py-2 bg-primary disabled:opacity-50 text-on-primary rounded font-bold text-sm tracking-widest hover:bg-primary-fixed transition-colors">Update Patient</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Patient Modal */}
      {isDeletePatientModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl shadow-xl flex flex-col border border-outline-variant">
            <div className="p-6 border-b border-outline-variant">
              <h2 className="font-headline-md font-bold text-regulatory-alert flex items-center gap-2">
                <span className="material-symbols-outlined">warning</span> Delete Patient
              </h2>
            </div>
            <div className="p-6">
              <p className="text-on-surface">Are you sure you want to delete this patient? This action cannot be undone.</p>
            </div>
            <div className="p-6 border-t border-outline-variant flex justify-end gap-3 bg-surface-muted rounded-b-2xl">
               <button onClick={() => setIsDeletePatientModalOpen(false)} className="px-4 py-2 border border-outline-variant text-on-surface rounded font-bold text-sm hover:bg-surface-variant transition-colors">Cancel</button>
               <button onClick={handleDeletePatient} className="px-6 py-2 bg-error-container text-regulatory-alert rounded font-bold text-sm tracking-widest hover:bg-error-container/80 transition-colors border border-regulatory-alert">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-xl flex flex-col border border-outline-variant">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-muted rounded-t-2xl">
              <h2 className="font-headline-md font-bold text-on-surface">Add Account</h2>
              <button onClick={() => setIsAddAccountModalOpen(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block font-bold text-on-surface mb-2">Name</label>
                <input 
                  type="text" 
                  value={newAccountForm.name} 
                  onChange={e => setNewAccountForm({...newAccountForm, name: e.target.value})} 
                  className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors" 
                  placeholder="e.g. Budi Darmawan" 
                />
              </div>
              <div>
                <label className="block font-bold text-on-surface mb-2">Username</label>
                <input 
                  type="text" 
                  value={newAccountForm.username} 
                  onChange={e => setNewAccountForm({...newAccountForm, username: e.target.value})} 
                  className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors" 
                  placeholder="e.g. budi_manager" 
                />
              </div>
              <div>
                <label className="block font-bold text-on-surface mb-2">Password</label>
                <input 
                  type="password" 
                  value={newAccountForm.password} 
                  onChange={e => setNewAccountForm({...newAccountForm, password: e.target.value})} 
                  className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors" 
                  placeholder="Leave empty for staff, or set password" 
                />
              </div>
              <div>
                <label className="block font-bold text-on-surface mb-2">Role</label>
                <select 
                  value={newAccountForm.role} 
                  onChange={e => setNewAccountForm({...newAccountForm, role: e.target.value})} 
                  className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors"
                >
                  <option value="Manager">Manager</option>
                  <option value="Pengelola Apotek">Pengelola Apotek</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant flex justify-end gap-3 bg-surface-muted rounded-b-2xl mt-auto">
               <button onClick={() => setIsAddAccountModalOpen(false)} className="px-4 py-2 border border-outline-variant text-on-surface rounded font-bold text-sm hover:bg-surface-variant transition-colors">Cancel</button>
               <button onClick={handleAddAccount} disabled={!newAccountForm.name} className="px-6 py-2 bg-primary disabled:opacity-50 text-on-primary rounded font-bold text-sm tracking-widest hover:bg-primary-fixed transition-colors">Save Account</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {isEditAccountModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-xl flex flex-col border border-outline-variant">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-muted rounded-t-2xl">
              <h2 className="font-headline-md font-bold text-on-surface">Edit Account</h2>
              <button onClick={() => setIsEditAccountModalOpen(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block font-bold text-on-surface mb-2">Name</label>
                <input 
                  type="text" 
                  value={editAccountForm.name} 
                  onChange={e => setEditAccountForm({...editAccountForm, name: e.target.value})} 
                  className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors" 
                  placeholder="e.g. Budi Darmawan" 
                />
              </div>
              <div>
                <label className="block font-bold text-on-surface mb-2">Username</label>
                <input 
                  type="text" 
                  value={editAccountForm.username} 
                  onChange={e => setEditAccountForm({...editAccountForm, username: e.target.value})} 
                  className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors" 
                  placeholder="e.g. budi_manager" 
                />
              </div>
              <div>
                <label className="block font-bold text-on-surface mb-2">Password</label>
                <input 
                  type="password" 
                  value={editAccountForm.password} 
                  onChange={e => setEditAccountForm({...editAccountForm, password: e.target.value})} 
                  className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors" 
                  placeholder="Leave empty to keep unchanged" 
                />
              </div>
              <div>
                <label className="block font-bold text-on-surface mb-2">Role</label>
                <select 
                  value={editAccountForm.role} 
                  onChange={e => setEditAccountForm({...editAccountForm, role: e.target.value})} 
                  className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors"
                >
                  <option value="Manager">Manager</option>
                  <option value="Pengelola Apotek">Pengelola Apotek</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant flex justify-end gap-3 bg-surface-muted rounded-b-2xl mt-auto">
               <button onClick={() => setIsEditAccountModalOpen(false)} className="px-4 py-2 border border-outline-variant text-on-surface rounded font-bold text-sm hover:bg-surface-variant transition-colors">Cancel</button>
               <button onClick={handleEditAccount} disabled={!editAccountForm.name} className="px-6 py-2 bg-primary disabled:opacity-50 text-on-primary rounded font-bold text-sm tracking-widest hover:bg-primary-fixed transition-colors">Update Account</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal Confirmation */}
      {isDeleteAccountModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl shadow-xl flex flex-col border border-regulatory-alert">
            <div className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-[32px] text-regulatory-alert">warning</span>
              </div>
              <h2 className="font-headline-md font-bold text-on-surface">Konfirmasi Hapus</h2>
              <p className="text-on-surface-variant text-sm">
                Apakah Anda yakin ingin menghapus akun ini?
              </p>
            </div>
            <div className="p-6 border-t border-outline-variant flex justify-center gap-3 bg-surface-muted rounded-b-2xl">
               <button onClick={() => { setIsDeleteAccountModalOpen(false); setDeleteAccountId(null); }} className="px-6 py-2 border border-outline-variant text-on-surface rounded font-bold text-sm hover:bg-surface-variant transition-colors flex-1">Batal</button>
               <button onClick={handleDeleteAccount} className="px-6 py-2 bg-regulatory-alert text-white rounded font-bold text-sm tracking-widest hover:bg-[#c9302c] transition-colors flex-1">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit PBF Modal */}
      {isEditPbfModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-xl flex flex-col border border-outline-variant">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-muted rounded-t-2xl">
              <h2 className="font-headline-md font-bold text-on-surface">Edit PBF</h2>
              <button onClick={() => setIsEditPbfModalOpen(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Nama PBF <span className="text-regulatory-alert">*</span></label>
                <input type="text" value={editPbfForm.name} onChange={(e) => setEditPbfForm({...editPbfForm, name: e.target.value})} className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant rounded focus:outline-none focus:border-primary" placeholder="Masukkan nama PBF..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Nama Sales</label>
                <input type="text" value={editPbfForm.sales} onChange={(e) => setEditPbfForm({...editPbfForm, sales: e.target.value})} className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant rounded focus:outline-none focus:border-primary" placeholder="Nama representatif sales..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Nomor Telepon PBF <span className="text-regulatory-alert">*</span></label>
                <input type="text" value={editPbfForm.phone} onChange={(e) => setEditPbfForm({...editPbfForm, phone: e.target.value})} className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant rounded focus:outline-none focus:border-primary" placeholder="021-XXXXXXX" />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Nomor Izin PBF</label>
                <input type="text" value={editPbfForm.license} onChange={(e) => setEditPbfForm({...editPbfForm, license: e.target.value})} className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant rounded focus:outline-none focus:border-primary" placeholder="Masukkan No. Izin..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Alamat PBF <span className="text-regulatory-alert">*</span></label>
                <textarea value={editPbfForm.address} onChange={(e) => setEditPbfForm({...editPbfForm, address: e.target.value})} className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded focus:outline-none focus:border-primary shrink-0 min-h-[80px]" placeholder="Alamat lengkap PBF..."></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant flex justify-end gap-3 bg-surface-muted rounded-b-2xl mt-auto">
               <button onClick={() => setIsEditPbfModalOpen(false)} className="px-4 py-2 border border-outline-variant text-on-surface rounded font-bold text-sm hover:bg-surface-variant transition-colors">Batal</button>
               <button onClick={handleEditPbf} disabled={!editPbfForm.name} className="px-6 py-2 bg-primary disabled:opacity-50 text-on-primary rounded font-bold text-sm tracking-widest hover:bg-primary-fixed transition-colors">Simpan Perubahan</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete PBF Confirmation Modal */}
      {deletePbfId && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl shadow-xl flex flex-col border border-outline-variant">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-error-container text-regulatory-alert rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-3xl">warning</span>
              </div>
              <h2 className="font-headline-sm font-bold text-on-surface">Hapus Data PBF?</h2>
              <p className="text-on-surface-variant text-sm">
                Apakah Anda yakin ingin menghapus PBF ini? Data yang dihapus tidak dapat dikembalikan.
              </p>
            </div>
            <div className="p-6 pt-0 flex justify-end gap-3">
               <button onClick={() => setDeletePbfId(null)} className="flex-1 py-2.5 border border-outline-variant text-on-surface rounded font-bold text-sm hover:bg-surface-variant transition-colors">Batal</button>
               <button onClick={handleDeletePbf} className="flex-1 py-2.5 bg-regulatory-alert text-white rounded font-bold text-sm hover:bg-red-700 transition-colors">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
