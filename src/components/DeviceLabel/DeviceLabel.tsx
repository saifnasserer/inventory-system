import React from "react";
import { QRCodeSVG } from "qrcode.react";
import "./DeviceLabel.css";

interface DeviceLabelProps {
    assetId: string;
    deviceType?: string;
    model?: string;
    serialNumber?: string;
}

export const DeviceLabel: React.FC<DeviceLabelProps> = ({
    assetId,
    deviceType,
    model,
    serialNumber,
}) => {
    return (
        <div className="device-label">
            <div className="label-header">
                <h3>Asset ID</h3>
                <div className="asset-id">{assetId}</div>
            </div>

            <div className="qr-code-container">
                <QRCodeSVG
                    value={assetId}
                    size={120}
                    level="H"
                    includeMargin={true}
                />
            </div>

            <div className="device-info">
                {deviceType && (
                    <div className="info-row">
                        <span className="label">Type:</span>
                        <span className="value">{deviceType}</span>
                    </div>
                )}
                {model && (
                    <div className="info-row">
                        <span className="label">Model:</span>
                        <span className="value">{model}</span>
                    </div>
                )}
                {serialNumber && (
                    <div className="info-row">
                        <span className="label">S/N:</span>
                        <span className="value">{serialNumber}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
