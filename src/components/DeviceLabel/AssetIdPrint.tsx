import React from "react";
import "./DeviceLabel.css";

interface AssetIdPrintProps {
    assetIds: string[];
}

export const AssetIdPrint = React.forwardRef<HTMLDivElement, AssetIdPrintProps>(
    ({ assetIds }, ref) => {
        return (
            <div style={{ overflow: "hidden", height: 0, width: 0 }}>
                <div ref={ref} className="print-container">
                    <div style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "10px",
                        padding: "20px"
                    }}>
                        {assetIds.map((id, index) => (
                            <div
                                key={`${id}-${index}`}
                                style={{
                                    border: "2px solid black",
                                    padding: "10px",
                                    width: "200px",
                                    height: "100px",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    pageBreakInside: "avoid",
                                    backgroundColor: "white"
                                }}
                            >
                                <span style={{
                                    fontSize: "12px",
                                    fontWeight: "bold",
                                    marginBottom: "5px"
                                }}>
                                    Asset ID
                                </span>
                                <span style={{
                                    fontSize: "24px",
                                    fontWeight: "900",
                                    fontFamily: "monospace"
                                }}>
                                    {id}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
);
