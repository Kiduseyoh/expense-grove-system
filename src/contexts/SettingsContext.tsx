
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings } from '../types/api';
import { appSettingsAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface SettingsContextType {
  settings: AppSettings | null;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  id: '',
  userId: '',
  currency: 'USD',
  theme: 'light',
  language: 'en',
  notificationsEnabled: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const fetchSettings = async () => {
    if (!isAuthenticated) {
      setSettings(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const appSettings = await appSettingsAPI.getSettings();
      setSettings(appSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchSettings();
    }
  }, [isAuthenticated, authLoading]);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      setIsLoading(true);
      const updatedSettings = await appSettingsAPI.updateSettings(newSettings);
      setSettings(updatedSettings);
      toast({
        title: "Settings updated",
        description: "Your settings have been successfully updated.",
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update settings",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetSettings = async () => {
    try {
      setIsLoading(true);
      await appSettingsAPI.resetSettings();
      await fetchSettings();
      toast({
        title: "Settings reset",
        description: "Your settings have been reset to defaults.",
      });
    } catch (error) {
      console.error('Failed to reset settings:', error);
      toast({
        title: "Reset failed",
        description: error instanceof Error ? error.message : "Failed to reset settings",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        updateSettings,
        resetSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
