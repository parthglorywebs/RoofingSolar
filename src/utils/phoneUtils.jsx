/**
 * Formats the phone number into the pattern XXX-XXX-XXXX
 * @param {string} value - The raw phone number value
 * @returns {string} - The formatted phone number
 */
export const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');  // Remove all non-digits
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    
    if (match) {
      return `${match[1]}${match[2] ? '-' + match[2] : ''}${match[3] ? '-' + match[3] : ''}`;
    }
  
    return cleaned;
  };
  
  /**
   * Removes the phone number format and returns only the 10 digits
   * @param {string} value - The formatted phone number
   * @returns {string} - The unformatted 10-digit phone number
   */
  export const removePhoneNumberFormat = (value) => {
    return value.replace(/\D/g, '');  // Remove all non-digit characters
  };
  