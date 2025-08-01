/**
 * WhatsApp Integration Utilities for DetetizaPro
 * Provides functions to generate WhatsApp links and handle messaging
 */

export interface WhatsAppMessageData {
  phone: string;
  message?: string;
  clientName?: string;
  serviceType?: string;
  dueDate?: string;
}

export class WhatsAppUtils {
  // Default message templates
  private static readonly DEFAULT_MESSAGES = {
    general: 'Olá, gostaria de falar sobre seus serviços de dedetização.',
    renewal: 'Olá {clientName}, seu contrato de dedetização vence em {dueDate}. Entre em contato conosco para renovar!',
    service: 'Olá {clientName}, temos um agendamento de {serviceType} marcado. Confirme sua disponibilidade.',
    followup: 'Olá {clientName}, como está tudo após nosso último serviço de dedetização?',
  };

  /**
   * Formats a phone number to international format
   * @param phone - Phone number in various formats
   * @returns Formatted phone number with country code
   */
  static formatPhoneNumber(phone: string): string {
    if (!phone) return '';

    // Remove all non-numeric characters
    const cleanPhone = phone.replace(/\D/g, '');

    // If already has country code (starts with 55 for Brazil)
    if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
      return `+${cleanPhone}`;
    }

    // If has area code but no country code (11 digits: XX XXXXX-XXXX)
    if (cleanPhone.length === 11) {
      return `+55${cleanPhone}`;
    }

    // If has area code but no country code (10 digits: XX XXXX-XXXX)
    if (cleanPhone.length === 10) {
      return `+55${cleanPhone}`;
    }

    // If only has the number without area code (8 or 9 digits)
    if (cleanPhone.length === 8 || cleanPhone.length === 9) {
      // Assume São Paulo area code (11) as default
      return `+5511${cleanPhone}`;
    }

    // Return as is if format is unclear
    return `+55${cleanPhone}`;
  }

  /**
   * Generates a WhatsApp link with message
   * @param data - WhatsApp message data
   * @returns WhatsApp web/app link
   */
  static generateWhatsAppLink(data: WhatsAppMessageData): string {
    const { phone, message, clientName, serviceType, dueDate } = data;

    if (!phone) {
      console.warn('WhatsApp: Phone number is required');
      return '';
    }

    const formattedPhone = this.formatPhoneNumber(phone);
    let finalMessage = message || this.DEFAULT_MESSAGES.general;

    // Replace placeholders in message
    if (clientName) {
      finalMessage = finalMessage.replace(/{clientName}/g, clientName);
    }
    if (serviceType) {
      finalMessage = finalMessage.replace(/{serviceType}/g, serviceType);
    }
    if (dueDate) {
      finalMessage = finalMessage.replace(/{dueDate}/g, dueDate);
    }

    // Encode message for URL
    const encodedMessage = encodeURIComponent(finalMessage);

    // Generate WhatsApp link
    return `https://wa.me/${formattedPhone.replace('+', '')}?text=${encodedMessage}`;
  }

  /**
   * Opens WhatsApp with the specified message
   * @param data - WhatsApp message data
   */
  static openWhatsApp(data: WhatsAppMessageData): void {
    const link = this.generateWhatsAppLink(data);
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  }

  /**
   * Generates a renewal reminder message
   * @param clientName - Client name
   * @param dueDate - Contract due date
   * @returns Formatted message
   */
  static generateRenewalMessage(clientName: string, dueDate: string): string {
    return this.DEFAULT_MESSAGES.renewal
      .replace(/{clientName}/g, clientName)
      .replace(/{dueDate}/g, dueDate);
  }

  /**
   * Generates a service confirmation message
   * @param clientName - Client name
   * @param serviceType - Type of service
   * @returns Formatted message
   */
  static generateServiceMessage(clientName: string, serviceType: string): string {
    return this.DEFAULT_MESSAGES.service
      .replace(/{clientName}/g, clientName)
      .replace(/{serviceType}/g, serviceType);
  }

  /**
   * Generates a follow-up message
   * @param clientName - Client name
   * @returns Formatted message
   */
  static generateFollowUpMessage(clientName: string): string {
    return this.DEFAULT_MESSAGES.followup.replace(/{clientName}/g, clientName);
  }

  /**
   * Validates if a phone number is valid for WhatsApp
   * @param phone - Phone number to validate
   * @returns True if valid, false otherwise
   */
  static isValidPhoneNumber(phone: string): boolean {
    if (!phone) return false;

    const cleanPhone = phone.replace(/\D/g, '');
    
    // Valid Brazilian phone numbers should have 10 or 11 digits (with area code)
    // Or 12-13 digits (with country code)
    return cleanPhone.length >= 10 && cleanPhone.length <= 13;
  }

  /**
   * Formats phone number for display
   * @param phone - Phone number to format
   * @returns Formatted phone number for display
   */
  static formatPhoneForDisplay(phone: string): string {
    if (!phone) return '';

    const cleanPhone = phone.replace(/\D/g, '');

    // Format Brazilian phone numbers
    if (cleanPhone.startsWith('55')) {
      // +55 (XX) XXXXX-XXXX or +55 (XX) XXXX-XXXX
      const withoutCountry = cleanPhone.substring(2);
      if (withoutCountry.length === 11) {
        return `+55 (${withoutCountry.substring(0, 2)}) ${withoutCountry.substring(2, 7)}-${withoutCountry.substring(7)}`;
      } else if (withoutCountry.length === 10) {
        return `+55 (${withoutCountry.substring(0, 2)}) ${withoutCountry.substring(2, 6)}-${withoutCountry.substring(6)}`;
      }
    }

    // Format without country code
    if (cleanPhone.length === 11) {
      return `(${cleanPhone.substring(0, 2)}) ${cleanPhone.substring(2, 7)}-${cleanPhone.substring(7)}`;
    } else if (cleanPhone.length === 10) {
      return `(${cleanPhone.substring(0, 2)}) ${cleanPhone.substring(2, 6)}-${cleanPhone.substring(6)}`;
    }

    return phone; // Return original if format is unclear
  }

  /**
   * Gets message templates
   * @returns Object with message templates
   */
  static getMessageTemplates() {
    return { ...this.DEFAULT_MESSAGES };
  }

  /**
   * Copies WhatsApp link to clipboard
   * @param data - WhatsApp message data
   * @returns Promise<boolean> - Success status
   */
  static async copyLinkToClipboard(data: WhatsAppMessageData): Promise<boolean> {
    try {
      const link = this.generateWhatsAppLink(data);
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(link);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error copying WhatsApp link:', error);
      return false;
    }
  }
}

// React hook for WhatsApp functionality
export const useWhatsApp = () => {
  const sendMessage = (data: WhatsAppMessageData) => {
    WhatsAppUtils.openWhatsApp(data);
  };

  const sendWhatsAppMessage = (data: WhatsAppMessageData) => {
    WhatsAppUtils.openWhatsApp(data);
  };

  const generateLink = (data: WhatsAppMessageData) => {
    return WhatsAppUtils.generateWhatsAppLink(data);
  };

  const copyLink = async (data: WhatsAppMessageData) => {
    return await WhatsAppUtils.copyLinkToClipboard(data);
  };

  const formatPhone = (phone: string) => {
    return WhatsAppUtils.formatPhoneForDisplay(phone);
  };

  const isValidPhone = (phone: string) => {
    return WhatsAppUtils.isValidPhoneNumber(phone);
  };

  return {
    sendMessage,
    sendWhatsAppMessage,
    generateLink,
    copyLink,
    formatPhone,
    isValidPhone,
    templates: WhatsAppUtils.getMessageTemplates(),
  };
};
