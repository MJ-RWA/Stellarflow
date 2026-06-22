import React from "react";
import { ClipboardPaste } from "lucide-react";
import toast from "react-hot-toast";
import * as StellarSdk from "@stellar/stellar-sdk";
import '../index.css'

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const AddressInput: React.FC<AddressInputProps> = ({
  value,
  onChange,
  placeholder = "Enter the Stellar address (G...)",
  className = "",
}) => {
  const handlePaste = async () => {
    try {
      // Request to access the clipBoard
      if (!navigator.clipboard) {
        toast.error("Your browser does not support access to the clipboard.");
        return;
      }

      const text = await navigator.clipboard.readText();
      const cleanText = text.trim();

      if (!cleanText) {
        toast.error("The clipboard is empty");
        return;
      }

      // Validation of the public key with StellarSdk
      if (StellarSdk.StrKey.isValidEd25519PublicKey(cleanText)) {
        onChange(cleanText);
        toast.success("Address successfully pasted!");
      } else {
        toast.error("The clipboard contents are not a valid Stellar address.");
      }
    } catch (error) {
      //
      toast.error("Clipboard access permission denied");
      console.error("Clipboard Error: ", error);
    }
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className=" input-field w-full pr-12 pl-4 py-3 bg-opacity-10 bg-white border border-gray-600 rounded-lg focus:outline-none text-white placeholder-gray-400 text-sm transition-all"
      />
      <button
        type="button"
        onClick={handlePaste}
        className="absolute right-3 p-1.5 text-gray-400 hover:text-white hover:bg-white hover:bg-opacity-10 rounded-md transition-all quick-action-btn"
        title="Paste the address"
      >
        <ClipboardPaste size={18} />
      </button>
    </div>
  );
};
