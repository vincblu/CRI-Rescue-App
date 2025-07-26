// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '../config/firebaseConfig';
import { getUserProfile, UserProfile } from '../services/userService'; // Assicurati che UserProfile includa 'role', 'nome', 'cognome'

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean; // Aggiunto
  canModifyEvents: boolean; // Aggiunto (se è una logica separata da isAdmin)
  nome: string | null; // Aggiunto
  cognome: string | null; // Aggiunto
  currentUser: any; // Espongo anche il firebaseUser raw per compatibilità se serve altrove
  squadraNome: string | null; // Nuovo campo
  squadraId: string | null;   // Nuovo campo
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseAuthUser, setFirebaseAuthUser] = useState<any>(null); // Per tenere traccia dell'oggetto utente Firebase

  // Stati derivati dai permessi
  const [isAdmin, setIsAdmin] = useState(false);
  const [canModifyEvents, setCanModifyEvents] = useState(false); // Puoi semplificare a isAdmin se è sempre lo stesso
  const [nome, setNome] = useState<string | null>(null);
  const [cognome, setCognome] = useState<string | null>(null);
  const [squadraNome, setSquadraNome] = useState<string | null>(null); // Assicurati che siano qui
  const [squadraId, setSquadraId] = useState<string | null>(null); 
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fUser) => {
      console.log('AuthContext: onAuthStateChanged triggerato. Firebase User:', fUser ? fUser.email : 'null');
      setFirebaseAuthUser(fUser); // Salvo l'utente Firebase raw

      if (fUser) {
        try {
          const profile = await getUserProfile(fUser.uid);
          console.log('AuthContext: Profilo utente recuperato da Firestore:', profile);
          setUser(profile);

          // Calcola i permessi basandosi sul profilo recuperato
          const userIsAdmin = profile?.role === 'admin';
          setIsAdmin(userIsAdmin);
          setCanModifyEvents(userIsAdmin); // Se solo gli admin possono modificare eventi

          setNome(profile?.nome || null);
          setCognome(profile?.cognome || null);

          console.log(`AuthContext: User is Admin: ${userIsAdmin}, Nome: ${profile?.nome}, Cognome: ${profile?.cognome}`);

        } catch (error) {
          console.error('AuthContext: Errore nel recupero del profilo utente da Firestore:', error);
          setUser(null);
          setIsAdmin(false);
          setCanModifyEvents(false);
          setNome(null);
          setCognome(null);
        }
      } else {
        console.log('AuthContext: Nessun utente Firebase loggato. Resetting state.');
        setUser(null);
        setIsAdmin(false);
        setCanModifyEvents(false);
        setNome(null);
        setCognome(null);
      }
      setLoading(false);
      console.log('AuthContext: Loading stato finale:', false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin,
      canModifyEvents,
      nome,
      cognome,
      squadraNome, // Espongo il nuovo campo
      squadraId,   // Espongo il nuovo campo
      currentUser: firebaseAuthUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Se hai un componente AdminOnly separato, potrebbe essere simile a questo:
export const AdminOnly: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) {
    return null; // O un ActivityIndicator
  }
  return isAdmin ? <>{children}</> : null;
};

// Se hai un hook usePermissions separato, potresti rimuoverlo o renderlo un alias di useAuth
export const usePermissions = () => {
  const { isAdmin, canModifyEvents, nome, cognome, squadraNome, squadraId } = useAuth(); // Aggiornato usePermissions
  return { isAdmin, canModifyEvents, nome, cognome, squadraNome, squadraId };
};