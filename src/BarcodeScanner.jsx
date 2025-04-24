import React, { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5Qrcode("reader");
    scanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      (decodedText) => {
        scanner.stop().then(() => {
          onScanSuccess(decodedText);
        });
      },
      (errorMessage) => {
        // console.log("Scan error:", errorMessage);
      }
    );

    return () => {
      scanner.stop().catch((err) => console.error("Stop error", err));
    };
  }, [onScanSuccess]);

  return (
    <div>
      <div id="reader" style={{ width: "100%" }} />
      <button onClick={onClose} style={{ marginTop: "1rem" }}>
        Cancel
      </button>
    </div>
  );
};

export default BarcodeScanner;