/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Map, 
  Wheat, 
  Layers, 
  HelpCircle, 
  RefreshCw, 
  FileDown, 
  FileUp, 
  Sprout, 
  Scale, 
  CheckCircle2, 
  AlertCircle,
  Settings,
  Users
} from 'lucide-react';

import { Animal, CropField, FeedInventory, FeedAssignment, AnimalStatus, CropStatus, Partner, PartnerTransaction } from './types';
import { initialAnimals, initialFeeds, initialAssignments, initialFields, initialPartners, initialPartnerTransactions } from './initialData';

import Dashboard from './components/Dashboard';
import LivestockManager from './components/LivestockManager';
import CropManager from './components/CropManager';
import FeedManager from './components/FeedManager';
import SettingsManager from './components/SettingsManager';
import PartnersManager from './components/PartnersManager';

import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db, auth } from './firebase';
import { handleFirestoreError, OperationType, loginWithGoogle, logoutUser, testConnection } from './firebaseUtils';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Local states
  const [animals, setAnimals] = useState<Animal[]>(() => {
    const saved = localStorage.getItem('agro_control_animals');
    return saved ? JSON.parse(saved) : initialAnimals;
  });

  const [feeds, setFeeds] = useState<FeedInventory[]>(() => {
    const saved = localStorage.getItem('agro_control_feeds');
    return saved ? JSON.parse(saved) : initialFeeds;
  });

  const [feedAssignments, setFeedAssignments] = useState<FeedAssignment[]>(() => {
    const saved = localStorage.getItem('agro_control_assignments');
    return saved ? JSON.parse(saved) : initialAssignments;
  });

  const [fields, setFields] = useState<CropField[]>(() => {
    const saved = localStorage.getItem('agro_control_fields');
    return saved ? JSON.parse(saved) : initialFields;
  });

  const [partners, setPartners] = useState<Partner[]>(() => {
    const saved = localStorage.getItem('agro_control_partners');
    return saved ? JSON.parse(saved) : initialPartners;
  });

  const [partnerTransactions, setPartnerTransactions] = useState<PartnerTransaction[]>(() => {
    const saved = localStorage.getItem('agro_control_partner_transactions');
    return saved ? JSON.parse(saved) : initialPartnerTransactions;
  });

  // User and Loading status
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState<boolean>(true);

  // Toast message states
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // --- Exchange Rate State & Fetch ---
  const [exchangeRate, setExchangeRate] = useState<number>(() => {
    const saved = localStorage.getItem('agro_exchange_rate');
    return saved ? parseFloat(saved) : 930.00;
  });
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [tempRate, setTempRate] = useState('');
  const [exchangeRateDate, setExchangeRateDate] = useState<string>(() => {
    return localStorage.getItem('agro_exchange_rate_date') || '';
  });

  const handleSaveRate = () => {
    const val = parseFloat(tempRate);
    if (!isNaN(val) && val > 0) {
      setExchangeRate(val);
      localStorage.setItem('agro_exchange_rate', val.toString());
      localStorage.setItem('agro_exchange_rate_date', 'Manual');
      setExchangeRateDate('Manual');
      showToast(`Tipo de cambio fijado manualmente en $${val.toLocaleString('es-AR')} ARS.`, 'info');
    }
    setIsEditingRate(false);
  };

  useEffect(() => {
    const fetchRate = async () => {
      // Fetch latest official rate from DolarAPI (representing Banco Nacion)
      try {
        const res = await fetch('https://dolarapi.com/v1/dolares/oficial');
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.venta === 'number') {
            setExchangeRate(data.venta);
            localStorage.setItem('agro_exchange_rate', data.venta.toString());
            const dateStr = new Date(data.fechaActualizacion || new Date()).toLocaleDateString('es-AR', {
              day: 'numeric',
              month: 'short'
            });
            const updatedLabel = `BNA • ${dateStr}`;
            setExchangeRateDate(updatedLabel);
            localStorage.setItem('agro_exchange_rate_date', updatedLabel);
          }
        }
      } catch (error) {
        console.error('Error fetching Banco Nacion exchange rate:', error);
      }
    };
    fetchRate();
  }, []);

  // Test Firebase connection once on startup
  useEffect(() => {
    testConnection();
  }, []);

  // Monitor Google Authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setUserLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Shared Firestore Document DB UID (Option B: Centralized Shared Database)
  const DB_UID = "shared_farm";

  // Handle Cloud Data Firestore Subscriptions always (Centralized Shared DB)
  useEffect(() => {
    const animalsPath = `users/${DB_UID}/animals`;
    const unsubscribeAnimals = onSnapshot(collection(db, animalsPath), (snapshot) => {
      const items: Animal[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as Animal);
      });
      // Sort to respect top items
      setAnimals(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, animalsPath);
    });

    const feedsPath = `users/${DB_UID}/feeds`;
    const unsubscribeFeeds = onSnapshot(collection(db, feedsPath), (snapshot) => {
      const items: FeedInventory[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as FeedInventory);
      });
      setFeeds(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, feedsPath);
    });

    const assignmentsPath = `users/${DB_UID}/feedAssignments`;
    const unsubscribeAssignments = onSnapshot(collection(db, assignmentsPath), (snapshot) => {
      const items: FeedAssignment[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as FeedAssignment);
      });
      setFeedAssignments(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, assignmentsPath);
    });

    const fieldsPath = `users/${DB_UID}/fields`;
    const unsubscribeFields = onSnapshot(collection(db, fieldsPath), (snapshot) => {
      const items: CropField[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as CropField);
      });
      setFields(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, fieldsPath);
    });

    const partnersPath = `users/${DB_UID}/partners`;
    const unsubscribePartners = onSnapshot(collection(db, partnersPath), (snapshot) => {
      const items: Partner[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as Partner);
      });
      setPartners(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, partnersPath);
    });

    const partnerTransactionsPath = `users/${DB_UID}/partnerTransactions`;
    const unsubscribePartnerTransactions = onSnapshot(collection(db, partnerTransactionsPath), (snapshot) => {
      const items: PartnerTransaction[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as PartnerTransaction);
      });
      setPartnerTransactions(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, partnerTransactionsPath);
    });

    return () => {
      unsubscribeAnimals();
      unsubscribeFeeds();
      unsubscribeAssignments();
      unsubscribeFields();
      unsubscribePartners();
      unsubscribePartnerTransactions();
    };
  }, []);

  // Auto-sync states to localStorage (Offline view only)
  useEffect(() => {
    if (!user) {
      localStorage.setItem('agro_control_animals', JSON.stringify(animals));
    }
  }, [animals, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('agro_control_feeds', JSON.stringify(feeds));
    }
  }, [feeds, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('agro_control_assignments', JSON.stringify(feedAssignments));
    }
  }, [feedAssignments, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('agro_control_fields', JSON.stringify(fields));
    }
  }, [fields, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('agro_control_partners', JSON.stringify(partners));
    }
  }, [partners, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('agro_control_partner_transactions', JSON.stringify(partnerTransactions));
    }
  }, [partnerTransactions, user]);

  // Utility to show toast notifications
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Automated migration helper on first sync login (now synced to the shared_farm DB)
  const migrateLocalToFirestore = async (currentUser?: User) => {
    const migrationKey = `agro_control_migrated_shared`;
    if (localStorage.getItem(migrationKey)) {
      return;
    }

    try {
      showToast("Estableciendo sincronización inicial compartida...", "info");
      
      // Upload animals
      for (const animal of animals) {
        const payload = {
          ...animal,
          userId: DB_UID,
          createdAt: animal.createdAt || new Date().toISOString(),
          updatedAt: animal.updatedAt || new Date().toISOString(),
        };
        const cleanPayload = JSON.parse(JSON.stringify(payload));
        await setDoc(doc(db, `users/${DB_UID}/animals`, animal.id), cleanPayload);
      }

      // Upload feeds
      for (const feed of feeds) {
        const payload = {
          ...feed,
          userId: DB_UID,
          createdAt: feed.createdAt || new Date().toISOString(),
          updatedAt: feed.updatedAt || new Date().toISOString(),
        };
        const cleanPayload = JSON.parse(JSON.stringify(payload));
        await setDoc(doc(db, `users/${DB_UID}/feeds`, feed.id), cleanPayload);
      }

      // Upload feedAssignments
      for (const assignment of feedAssignments) {
        const payload = {
          ...assignment,
          userId: DB_UID,
          createdAt: assignment.createdAt || new Date().toISOString(),
        };
        const cleanPayload = JSON.parse(JSON.stringify(payload));
        await setDoc(doc(db, `users/${DB_UID}/feedAssignments`, assignment.id), cleanPayload);
      }

      // Upload fields
      for (const field of fields) {
        const payload = {
          ...field,
          userId: DB_UID,
          createdAt: field.createdAt || new Date().toISOString(),
          updatedAt: field.updatedAt || new Date().toISOString(),
        };
        const cleanPayload = JSON.parse(JSON.stringify(payload));
        await setDoc(doc(db, `users/${DB_UID}/fields`, field.id), cleanPayload);
      }

      // Upload partners
      for (const partner of partners) {
        const payload = {
          ...partner,
          userId: DB_UID,
          createdAt: partner.createdAt || new Date().toISOString(),
        };
        const cleanPayload = JSON.parse(JSON.stringify(payload));
        await setDoc(doc(db, `users/${DB_UID}/partners`, partner.id), cleanPayload);
      }

      // Upload partnerTransactions
      for (const tx of partnerTransactions) {
        const payload = {
          ...tx,
          userId: DB_UID,
          createdAt: tx.createdAt || new Date().toISOString(),
        };
        const cleanPayload = JSON.parse(JSON.stringify(payload));
        await setDoc(doc(db, `users/${DB_UID}/partnerTransactions`, tx.id), cleanPayload);
      }

      localStorage.setItem(migrationKey, 'true');
      showToast("¡Establecimiento migrado a la base de datos compartida!", "success");
    } catch (error: any) {
      console.error("Migration error:", error);
      showToast(`Error en la sincronización compartida: ${error.message || error}`, "error");
    }
  };

  // Run shared database migration on mount if needed
  useEffect(() => {
    const checkAndMigrate = async () => {
      const migrationKey = `agro_control_migrated_shared`;
      if (localStorage.getItem(migrationKey)) {
        return;
      }
      const hasCustomData = animals.length > 0 || feeds.length > 0 || fields.length > 0;
      if (hasCustomData) {
        setTimeout(() => {
          migrateLocalToFirestore();
        }, 1500);
      } else {
        localStorage.setItem(migrationKey, 'true');
      }
    };
    checkAndMigrate();
  }, []);

  // --- Actions Cattle ---
  const handleAddAnimal = async (newAnimal: Animal) => {
    const docPath = `users/${DB_UID}/animals/${newAnimal.id}`;
    try {
      const payload = {
        ...newAnimal,
        userId: DB_UID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, docPath), payload);
      showToast(`Animal caravana ${newAnimal.caravana} ingresado en la base de datos compartida.`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, docPath);
    }
  };

  const handleUpdateAnimalWeight = async (animalId: string, newWeight: number, date: string) => {
    const animal = animals.find(a => a.id === animalId);
    if (!animal) return;
    const sortedHistory = [...animal.weightHistory, { date, weight: newWeight }]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const docPath = `users/${DB_UID}/animals/${animalId}`;
    try {
      const payload = {
        ...animal,
        currentWeight: newWeight,
        weightHistory: sortedHistory,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, docPath), payload);
      showToast(`Historial de peso actualizado en la manga (Compartido).`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
    }
  };

  const handleAddFeedAssignment = async (assignment: FeedAssignment) => {
    // 1. Check stock level first
    const targetFeed = feeds.find(f => f.id === assignment.feedId);
    if (!targetFeed) {
      showToast('No se encontró el tipo de alimento seleccionado.', 'error');
      return;
    }

    if (targetFeed.stockKg < assignment.amountKg) {
      showToast(`Stock insuficiente de ${targetFeed.name}. Disponible: ${targetFeed.stockKg} kg.`, 'error');
      return;
    }

    try {
      const assignPayload = {
        ...assignment,
        userId: DB_UID,
        createdAt: new Date().toISOString()
      };
      const feedPayload = {
        ...targetFeed,
        stockKg: Math.max(0, targetFeed.stockKg - assignment.amountKg),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, `users/${DB_UID}/feedAssignments`, assignment.id), assignPayload);
      await setDoc(doc(db, `users/${DB_UID}/feeds`, targetFeed.id), feedPayload);
      
      showToast(`Ración suministrada hoy y restada del stock (Compartido).`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${DB_UID}/feedAssignments/${assignment.id}`);
    }
  };

  const handleRemoveAnimal = async (animalId: string) => {
    const animal = animals.find(a => a.id === animalId);
    if (confirm(`¿Está seguro que desea eliminar el animal ${animal?.caravana || ''}? Se perderán sus historiales.`)) {
      try {
        await deleteDoc(doc(db, `users/${DB_UID}/animals`, animalId));
        // Clean up assignments from Firestore
        const associateAssignments = feedAssignments.filter(as => as.animalId === animalId);
        for (const item of associateAssignments) {
          await deleteDoc(doc(db, `users/${DB_UID}/feedAssignments`, item.id));
        }
        showToast('Animal y registros de alimentación removidos (Compartido).', 'info');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${DB_UID}/animals/${animalId}`);
      }
    }
  };

  const handleUpdateAnimalStatus = async (animalId: string, status: AnimalStatus) => {
    const animal = animals.find(a => a.id === animalId);
    if (!animal) return;
    try {
      const payload = {
        ...animal,
        status,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, `users/${DB_UID}/animals`, animalId), payload);
      showToast(`Estado del animal actualizado a: ${status} (Compartido).`, 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${DB_UID}/animals/${animalId}`);
    }
  };

  // --- Actions Crops & Fields ---
  const handleAddField = async (newField: CropField) => {
    try {
      const payload = {
        ...newField,
        userId: DB_UID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, `users/${DB_UID}/fields`, newField.id), payload);
      showToast(`Lote "${newField.name}" registrado (Compartido).`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${DB_UID}/fields/${newField.id}`);
    }
  };

  const handleAddExpense = async (fieldId: string, expense: any) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;

    try {
      const payload = {
        ...field,
        expenses: [...field.expenses, expense],
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, `users/${DB_UID}/fields`, fieldId), payload);
      showToast(`Gasto registrado (Compartido).`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${DB_UID}/fields/${fieldId}`);
    }
  };

  const handleRemoveExpense = async (fieldId: string, expenseId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;

    try {
      const payload = {
        ...field,
        expenses: field.expenses.filter(e => e.id !== expenseId),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, `users/${DB_UID}/fields`, fieldId), payload);
      showToast(`Gasto removido (Compartido).`, 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${DB_UID}/fields/${fieldId}`);
    }
  };

  const handleToggleExpensePaid = async (fieldId: string, expenseId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;

    const updatedExpenses = field.expenses.map(e => {
      if (e.id === expenseId) {
        return {
          ...e,
          isPaid: !e.isPaid
        };
      }
      return e;
    });

    try {
      const payload = {
        ...field,
        expenses: updatedExpenses,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, `users/${DB_UID}/fields`, fieldId), payload);
      showToast(`Pago de egreso actualizado (Compartido).`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${DB_UID}/fields/${fieldId}`);
    }
  };

  const handleUpdateFieldStatus = async (fieldId: string, status: CropStatus, actualYieldTon?: number) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;

    if (status === 'Cosechado' && actualYieldTon) {
      const harvestKg = actualYieldTon * 1000;
      const existingFeedIdx = feeds.findIndex(fd => fd.name.toLowerCase().includes(field.cropType.toLowerCase().substring(0, 5)));
      
      try {
        const updatedField = {
          ...field,
          status,
          actualYieldTon,
          harvestDate: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, `users/${DB_UID}/fields`, fieldId), updatedField);

        if (existingFeedIdx >= 0) {
          const targetFeed = feeds[existingFeedIdx];
          const updatedFeed = {
            ...targetFeed,
            stockKg: targetFeed.stockKg + harvestKg,
            updatedAt: new Date().toISOString()
          };
          await setDoc(doc(db, `users/${DB_UID}/feeds`, targetFeed.id), updatedFeed);
        } else {
          const newFeedId = `fd-${Date.now()}`;
          const newFeed: FeedInventory = {
            id: newFeedId,
            name: `Cosecha ${field.cropType} (${field.name})`,
            stockKg: harvestKg,
            costPerKgUSD: 0.05,
            source: 'Producido',
            notes: `Transferencia automática de cosecha del lote ${field.name}.`,
            userId: DB_UID,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await setDoc(doc(db, `users/${DB_UID}/feeds`, newFeedId), newFeed);
        }
        showToast(`¡Cosecha existosa y forraje transferido (Compartido)!`, 'success');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${DB_UID}/fields/${fieldId}`);
      }
    } else {
      try {
        const updatedField = {
          ...field,
          status,
          actualYieldTon,
          updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, `users/${DB_UID}/fields`, fieldId), updatedField);
        showToast(`Estado del lote actualizado: ${status} (Compartido).`, 'info');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${DB_UID}/fields/${fieldId}`);
      }
    }
  };

  const handleRemoveField = async (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (confirm(`¿Está seguro que desea rescindir el arrendamiento del lote "${field?.name || ''}"?`)) {
      try {
        await deleteDoc(doc(db, `users/${DB_UID}/fields`, fieldId));
        showToast('Contrato de lote cancelado (Compartido).', 'info');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${DB_UID}/fields/${fieldId}`);
      }
    }
  };

  // --- Actions Partner Control ---
  const handleAddPartner = async (newPartner: Partner) => {
    const docPath = `users/${DB_UID}/partners/${newPartner.id}`;
    try {
      const payload = {
        ...newPartner,
        userId: DB_UID,
        createdAt: new Date().toISOString()
      };
      // Sanitize any potential undefined fields just in case
      const cleanPayload = JSON.parse(JSON.stringify(payload));
      await setDoc(doc(db, `users/${DB_UID}/partners`, newPartner.id), cleanPayload);
      showToast(`Socio "${newPartner.name}" registrado (Compartido).`, 'success');
    } catch (error: any) {
      console.error("Error adding partner:", error);
      showToast(`Error al registrar socio: ${error.message || error}`, 'error');
    }
  };

  const handleRemovePartner = async (partnerId: string) => {
    try {
      await deleteDoc(doc(db, `users/${DB_UID}/partners`, partnerId));
      showToast('Socio eliminado (Compartido).', 'info');
    } catch (error: any) {
      console.error("Error removing partner:", error);
      showToast(`Error al eliminar socio: ${error.message || error}`, 'error');
    }
  };

  const handleAddPartnerTransaction = async (newTx: PartnerTransaction) => {
    const docPath = `users/${DB_UID}/partnerTransactions/${newTx.id}`;
    try {
      const payload = {
        ...newTx,
        userId: DB_UID,
        createdAt: new Date().toISOString()
      };
      const cleanPayload = JSON.parse(JSON.stringify(payload));
      await setDoc(doc(db, `users/${DB_UID}/partnerTransactions`, newTx.id), cleanPayload);
      showToast(`Movimiento registrado (Compartido).`, 'success');
    } catch (error: any) {
      console.error("Error adding transaction:", error);
      showToast(`Error al registrar movimiento: ${error.message || error}`, 'error');
    }
  };

  const handleRemovePartnerTransaction = async (txId: string) => {
    try {
      await deleteDoc(doc(db, `users/${DB_UID}/partnerTransactions`, txId));
      showToast('Movimiento removido (Compartido).', 'info');
    } catch (error: any) {
      console.error("Error removing transaction:", error);
      showToast(`Error al eliminar movimiento: ${error.message || error}`, 'error');
    }
  };

  // --- Actions Feed Inventory Addition ---
  const handleAddFeed = async (newFeed: FeedInventory) => {
    try {
      const payload = {
        ...newFeed,
        userId: DB_UID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, `users/${DB_UID}/feeds`, newFeed.id), payload);
      showToast(`Tipo de alimento "${newFeed.name}" registrado (Compartido).`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${DB_UID}/feeds/${newFeed.id}`);
    }
  };

  const handleUpdateFeedStock = async (feedId: string, additionalKg: number, costUSD?: number) => {
    const feed = feeds.find(f => f.id === feedId);
    if (!feed) return;

    try {
      const payload = {
        ...feed,
        stockKg: feed.stockKg + additionalKg,
        costPerKgUSD: costUSD || feed.costPerKgUSD,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, `users/${DB_UID}/feeds`, feedId), payload);
      showToast(`Stock reabastecido (Compartido).`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${DB_UID}/feeds/${feedId}`);
    }
  };

  // --- Backups & Resets ---
  const handleResetData = async () => {
    if (confirm('¿Está seguro de reiniciar los datos? Se borrarán todos los cambios actuales de su hacienda compartida y se cargarán los registros iniciales de demostración.')) {
      try {
        showToast("Reiniciando datos compartidos...", "info");
        
        const clearCollection = async (colPath: string) => {
          const qSnap = await getDocs(collection(db, colPath));
          const promises = qSnap.docs.map(d => deleteDoc(d.ref));
          await Promise.all(promises);
        };

        // Query and clear all current Firestore subcollection entries
        await clearCollection(`users/${DB_UID}/animals`);
        await clearCollection(`users/${DB_UID}/feeds`);
        await clearCollection(`users/${DB_UID}/feedAssignments`);
        await clearCollection(`users/${DB_UID}/fields`);
        await clearCollection(`users/${DB_UID}/partners`);
        await clearCollection(`users/${DB_UID}/partnerTransactions`);

        // Zero local arrays first
        setAnimals([]);
        setFeeds([]);
        setFeedAssignments([]);
        setFields([]);
        setPartners([]);
        setPartnerTransactions([]);

        // Upload standard initial arrays
        for (const animal of initialAnimals) {
          const payload = { ...animal, userId: DB_UID, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
          await setDoc(doc(db, `users/${DB_UID}/animals`, animal.id), payload);
        }
        for (const feed of initialFeeds) {
          const payload = { ...feed, userId: DB_UID, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
          await setDoc(doc(db, `users/${DB_UID}/feeds`, feed.id), payload);
        }
        for (const assignment of initialAssignments) {
          const payload = { ...assignment, userId: DB_UID, createdAt: new Date().toISOString() };
          await setDoc(doc(db, `users/${DB_UID}/feedAssignments`, assignment.id), payload);
        }
        for (const field of initialFields) {
          const payload = { ...field, userId: DB_UID, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
          await setDoc(doc(db, `users/${DB_UID}/fields`, field.id), payload);
        }
        for (const partner of initialPartners) {
          const payload = { ...partner, userId: DB_UID, createdAt: new Date().toISOString() };
          await setDoc(doc(db, `users/${DB_UID}/partners`, partner.id), payload);
        }
        for (const tx of initialPartnerTransactions) {
          const payload = { ...tx, userId: DB_UID, createdAt: new Date().toISOString() };
          await setDoc(doc(db, `users/${DB_UID}/partnerTransactions`, tx.id), payload);
        }

        showToast('¡Datos de demostración cargados con éxito!', 'success');
      } catch (error: any) {
        console.error("Cloud reset error:", error);
        showToast(`Error al reiniciar los datos: ${error.message || error}`, "error");
      }
    }
  };

  const handleClearAllData = async () => {
    if (confirm('⚠️ ¿ESTÁ SEGURO DE ELIMINAR TODOS LOS DATOS?\nEsta acción es totalmente irreversible. Eliminará todos los animales, socios, lotes agrícolas, historiales de alimentación y stocks de alimentos actuales para comenzar con su establecimiento en blanco (cero).')) {
      try {
        showToast("Vaciando base de datos compartida...", "info");
        
        const clearCollection = async (colPath: string) => {
          const qSnap = await getDocs(collection(db, colPath));
          const promises = qSnap.docs.map(d => deleteDoc(d.ref));
          await Promise.all(promises);
        };

        // Query and clear all current Firestore subcollection entries
        await clearCollection(`users/${DB_UID}/animals`);
        await clearCollection(`users/${DB_UID}/feeds`);
        await clearCollection(`users/${DB_UID}/feedAssignments`);
        await clearCollection(`users/${DB_UID}/fields`);
        await clearCollection(`users/${DB_UID}/partners`);
        await clearCollection(`users/${DB_UID}/partnerTransactions`);

        setAnimals([]);
        setFeeds([]);
        setFeedAssignments([]);
        setFields([]);
        setPartners([]);
        setPartnerTransactions([]);
        showToast('¡Todos los datos compartidos se han limpiado por completo!', 'success');
      } catch (error: any) {
        console.error("Cloud clear error:", error);
        showToast(`Error al vaciar los datos compartidos: ${error.message || error}`, "error");
      }
    }
  };

  const handleExportData = () => {
    const database = { animals, feeds, feedAssignments, fields, partners, partnerTransactions };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(database, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `respaldo_agroganadero_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
    showToast('Copia de seguridad exportada correctamente.', 'success');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.animals && parsed.feeds && parsed.fields) {
            setAnimals(parsed.animals);
            setFeeds(parsed.feeds);
            setFeedAssignments(parsed.feedAssignments || []);
            setFields(parsed.fields);
            setPartners(parsed.partners || []);
            setPartnerTransactions(parsed.partnerTransactions || []);
            showToast('Base de datos importada exitosamente!', 'success');
          } else {
            showToast('El archivo cargado no tiene un formato válido de respaldo agropecuario.', 'error');
          }
        } catch (err) {
          showToast('Error al decodificar el archivo JSON de respaldo.', 'error');
        }
      };
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/60 font-sans text-slate-800 flex flex-col pb-16">
      
      {/* Toast Alert Widget */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-55 flex items-center gap-2.5 px-4.5 py-3 rounded-xl shadow-lg border animate-slideDown bg-white text-slate-800 border-slate-200">
          {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          {toast.type === 'info' && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
          {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-500" />}
          <span className="text-xs font-sans font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Top Banner Header & Primary Nav bar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo brand & metadata */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm">
              <Sprout className="h-5 w-5" />
            </div>
            <div>
              <span className="text-slate-900 font-sans font-bold text-sm leading-tight block">CAMPOSOFT • Control Agroganadero</span>
              <p className="text-[10px] text-slate-400 font-mono">Gestor Integral de Pasturas, Corral y Ganancia Fina de Kilos</p>
            </div>
          </div>

          {/* Cotización Peso-Dólar Banco Nación */}
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 px-3.5 py-1.5 rounded-xl text-xs shadow-2xs self-stretch md:self-auto justify-between">
            <div className="flex items-center gap-1.5 font-sans font-semibold text-slate-600">
              <span className="text-teal-600">💵</span>
              <span>Dólar BNA:</span>
            </div>
            {isEditingRate ? (
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-mono text-xs">$</span>
                <input
                  type="number"
                  value={tempRate}
                  onChange={(e) => setTempRate(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRate();
                    if (e.key === 'Escape') setIsEditingRate(false);
                  }}
                  className="w-20 p-0.5 border border-slate-300 rounded font-mono text-xs text-center bg-white focus:outline-teal-500 font-bold"
                  autoFocus
                />
                <button
                  onClick={handleSaveRate}
                  className="px-2 py-0.5 bg-teal-600 text-white rounded text-[10px] font-bold cursor-pointer hover:bg-teal-500 transition"
                >
                  Fijar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-800">${exchangeRate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-[9px] text-slate-400 font-mono bg-slate-200/80 px-1.5 py-0.5 rounded font-bold uppercase" title={exchangeRateDate}>
                  {exchangeRateDate ? exchangeRateDate : 'Oficial'}
                </span>
                <button
                  onClick={() => {
                    setTempRate(exchangeRate.toString());
                    setIsEditingRate(true);
                  }}
                  className="p-1 hover:text-teal-700 hover:bg-slate-200 text-[10px] text-teal-600 font-bold transition rounded cursor-pointer"
                  title="Ajustar cotización manualmente"
                >
                  [Editar]
                </button>
              </div>
            )}
          </div>

          {/* Quick Database Backup actions and Cloud Sync */}
          <div className="flex flex-wrap items-center gap-2">
            {userLoading ? (
              <div className="p-1.5 px-3 text-[10px] font-mono text-slate-450 bg-slate-100 rounded-lg animate-pulse">
                Iniciando...
              </div>
            ) : user ? (
              <div className="flex items-center gap-1.5 bg-emerald-50/80 border border-emerald-100 p-1 py-0.5 pl-2 rounded-lg" title="Sincronización activa en tiempo real">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-sans font-medium text-emerald-800">En Línea: {user.displayName || user.email}</span>
                <button 
                  onClick={async () => {
                    await logoutUser();
                    setUser(null);
                    showToast("Sincronización desconectada. Se restauraron tus datos locales del navegador.", "info");
                  }}
                  className="p-1 hover:text-rose-600 text-[10px] font-mono font-bold text-slate-400 hover:bg-rose-50 rounded transition"
                  title="Cerrar sesión de sincronización"
                >
                  [Salir]
                </button>
              </div>
            ) : (
              <button 
                onClick={async () => {
                  try {
                    const loggedInUser = await loginWithGoogle();
                    setUser(loggedInUser);
                    await migrateLocalToFirestore(loggedInUser);
                  } catch (e) {
                    showToast("Error de autenticación con Google.", "error");
                  }
                }}
                className="p-1 px-2.5 bg-teal-650 hover:bg-teal-700 text-white rounded-lg text-[10px] font-sans font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                title="Sincroniza tus datos entre múltiples dispositivos en tiempo real"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> Sincronizar en Múltiples Dispositivos
              </button>
            )}

            <button 
              onClick={handleExportData} 
              className="p-1 px-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-[10px] font-mono text-slate-550 flex items-center gap-1 transition"
              title="Descargar copia del sistema"
            >
              <FileDown className="h-3 w-3" /> Exportar
            </button>
            <label className="p-1 px-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-[10px] font-mono text-slate-550 flex items-center gap-1 cursor-pointer transition">
              <FileUp className="h-3 w-3" /> Importar
              <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
            </label>
            <button 
              onClick={handleResetData} 
              className="p-1 px-1.5 bg-rose-50/50 border border-rose-100 hover:bg-rose-100/50 rounded-lg text-[10px] font-mono text-rose-600 flex items-center gap-0.5 transition"
              title="Borrar cambios y reiniciar"
            >
              <RefreshCw className="h-3 w-3" /> Reiniciar
            </button>
          </div>
        </div>

        {/* Tab switcher tabs bar */}
        <div className="border-t border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8 overflow-x-auto select-none no-scrollbar">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-3.5 px-1 border-b-2 font-sans text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'dashboard' 
                    ? 'border-teal-600 text-teal-600' 
                    : 'border-transparent text-slate-505 hover:text-slate-800'
                }`}
              >
                <Layers className="h-4 w-4" /> Resumen General
              </button>
              
              <button
                onClick={() => setActiveTab('cattle')}
                className={`py-3.5 px-1 border-b-2 font-sans text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'cattle' 
                    ? 'border-teal-600 text-teal-600' 
                    : 'border-transparent text-slate-505 hover:text-slate-800'
                }`}
                id="tab-cattle"
              >
                <Scale className="h-4 w-4" /> Control Ganadero
              </button>

              <button
                onClick={() => setActiveTab('fields')}
                className={`py-3.5 px-1 border-b-2 font-sans text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'fields' 
                    ? 'border-teal-600 text-teal-600' 
                    : 'border-transparent text-slate-550 hover:text-slate-800'
                }`}
                id="tab-fields"
              >
                <Map className="h-4 w-4" /> Producción Agrícola (Lotes)
              </button>

              <button
                onClick={() => setActiveTab('feeds')}
                className={`py-3.5 px-1 border-b-2 font-sans text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'feeds' 
                    ? 'border-teal-600 text-teal-600' 
                    : 'border-transparent text-slate-550 hover:text-slate-800'
                }`}
              >
                <Wheat className="h-4 w-4" /> Alimentos y Silos
              </button>

              <button
                onClick={() => setActiveTab('partners')}
                className={`py-3.5 px-1 border-b-2 font-sans text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'partners' 
                    ? 'border-teal-600 text-teal-600' 
                    : 'border-transparent text-slate-550 hover:text-slate-800'
                }`}
                id="tab-partners"
              >
                <Users className="h-4 w-4" /> Control de Socios
              </button>

              <button
                onClick={() => setActiveTab('help')}
                className={`py-3.5 px-1 border-b-2 font-sans text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'help' 
                    ? 'border-teal-600 text-teal-600' 
                    : 'border-transparent text-slate-550 hover:text-slate-800'
                }`}
              >
                <HelpCircle className="h-4 w-4" /> Guía Operativa
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`py-3.5 px-1 border-b-2 font-sans text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'settings' 
                    ? 'border-teal-600 text-teal-600' 
                    : 'border-transparent text-slate-550 hover:text-slate-800'
                }`}
                id="tab-settings"
              >
                <Settings className="h-4 w-4" /> Configuración
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {activeTab === 'dashboard' && (
          <Dashboard 
            animals={animals} 
            fields={fields} 
            feeds={feeds} 
            setActiveTab={setActiveTab} 
            exchangeRate={exchangeRate}
          />
        )}
        
        {activeTab === 'cattle' && (
          <LivestockManager
            animals={animals}
            feeds={feeds}
            feedAssignments={feedAssignments}
            partners={partners}
            onAddAnimal={handleAddAnimal}
            onUpdateAnimalWeight={handleUpdateAnimalWeight}
            onAddFeedAssignment={handleAddFeedAssignment}
            onRemoveAnimal={handleRemoveAnimal}
            onUpdateAnimalStatus={handleUpdateAnimalStatus}
          />
        )}

        {activeTab === 'fields' && (
          <CropManager
            fields={fields}
            partners={partners}
            onAddField={handleAddField}
            onAddExpense={handleAddExpense}
            onRemoveExpense={handleRemoveExpense}
            onToggleExpensePaid={handleToggleExpensePaid}
            onUpdateFieldStatus={handleUpdateFieldStatus}
            onRemoveField={handleRemoveField}
            exchangeRate={exchangeRate}
          />
        )}

        {activeTab === 'feeds' && (
          <FeedManager
            feeds={feeds}
            feedAssignments={feedAssignments}
            animals={animals}
            onAddFeed={handleAddFeed}
            onUpdateFeedStock={handleUpdateFeedStock}
            exchangeRate={exchangeRate}
          />
        )}

        {activeTab === 'partners' && (
          <PartnersManager
            partners={partners}
            transactions={partnerTransactions}
            animals={animals}
            fields={fields}
            onAddPartner={handleAddPartner}
            onRemovePartner={handleRemovePartner}
            onAddTransaction={handleAddPartnerTransaction}
            onRemoveTransaction={handleRemovePartnerTransaction}
            exchangeRate={exchangeRate}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsManager
            user={user}
            userLoading={userLoading}
            animalsCount={animals.length}
            fieldsCount={fields.length}
            feedsCount={feeds.length}
            assignmentsCount={feedAssignments.filter(a => a.date === new Date().toISOString().split('T')[0]).length}
            onClearAllData={handleClearAllData}
            onResetData={handleResetData}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onLogin={async () => {
              try {
                const loggedInUser = await loginWithGoogle();
                setUser(loggedInUser);
                await migrateLocalToFirestore(loggedInUser);
              } catch (e) {
                showToast("Error de autenticación con Google.", "error");
              }
            }}
            onLogout={async () => {
              await logoutUser();
              setUser(null);
              showToast("Sincronización desconectada. Se restauraron tus datos locales del navegador.", "info");
            }}
          />
        )}

        {activeTab === 'help' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs max-w-3xl mx-auto space-y-6">
            <h2 className="text-xl font-sans font-bold text-slate-800">Guía de Operación Integral Agroganadera</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Camposoft está diseñado para entrelazar los números agrícolas y la hacienda bovina. Al producir su propio alimento en campos arrendados, usted minimiza los costos de engorde y genera una cadena de valor integrada.
            </p>

            <div className="space-y-4 text-xs font-sans">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <h3 className="font-bold text-teal-800 text-sm">1. Identificación y Control Ganadero</h3>
                <p className="text-slate-600">
                  Registre a sus animales identificándolos con la <strong>caravana física (ID único)</strong>. Cada vez que pesen a un animal en la manga, registre la nueva cifra desde la fila expandida del animal en la pestaña <strong>Control Ganadero</strong>. El sistema automáticamente graficará su velocidad de crecimiento (GDP - Ganancia Diaria Promedio) para detectar animales ineficientes.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <h3 className="font-bold text-emerald-800 text-sm">2. Planificación de Cultivo Propio (Lotes)</h3>
                <p className="text-slate-600">
                  Den de alta los campos o lotes arrendados en la pestaña <strong>Producción Agrícola</strong>. Agreguen todos los costos asociados de <i>Semillas, Fertilizantes, Servicios contratados de siembra, agroquímicos y diesel</i>. El sistema calcula en vivo el costo exacto por hectárea y el <strong>costo por kilo producido</strong>.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <h3 className="font-bold text-blue-800 text-sm">3. Ciclo de Cosecha Automático</h3>
                <p className="text-slate-600">
                  Cuando finalice el ciclo de un lote y se coseche (ej. picado de Maíz para Silaje), cambie su estado a <strong>"Cosechado"</strong> e ingrese la tonelada total obtenida. <strong>¡El sistema automáticamente convertirá esas toneladas en kilos de alimento y las ingresará al stock de Alimentos y Silos!</strong> optimizando el flujo de inventario sin cargas manuales.
                </p>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl space-y-1">
                <h3 className="font-bold text-purple-800 text-sm">4. Sincronización en Múltiples Dispositivos (Nube)</h3>
                <p className="text-slate-600">
                  ¿Quiere ver y actualizar la información de su hacienda en vivo desde su teléfono, tablet o computadora a la vez? Simplemente presione el botón <strong>"Sincronizar en Múltiples Dispositivos"</strong> en la esquina superior derecha e inicie sesión con su cuenta de Google. Sus datos actuales se migrarán automáticamente a la base de datos segura de Google Firebase, y cualquier cambio que realice se reflejará instantáneamente en todos sus dispositivos conectados.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-center">
              <span className="text-[10px] font-mono text-slate-400">Camposoft v1.2 • Software de Gestión Rural de Precisión</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
