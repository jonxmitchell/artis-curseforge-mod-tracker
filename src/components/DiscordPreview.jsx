"use client";

import { ScrollShadow } from "@nextui-org/react";
import { MessageSquare } from "lucide-react";

const PreviewEmbed = ({ template, fields }) => {
  const colorHex = `#${template.color.toString(16).padStart(6, "0")}`;

  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: "#313338" }}>
      <div className="flex gap-4">
        {/* Bot Avatar Placeholder */}
        <div className="w-10 h-10 rounded-full bg-default-300 shrink-0" />

        <div className="space-y-1 w-full">
          {/* Bot Name */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{template.username || "Mod Tracker"}</span>
            <span className="text-xs text-[#989AA2]">Today at {new Date().toLocaleTimeString()}</span>
          </div>

          {/* Embed Content */}
          {template.use_embed ? (
            <div className="rounded-lg overflow-hidden max-w-[520px]">
              {/* Left Border Accent */}
              <div className="flex" style={{ backgroundColor: "#2B2D31" }}>
                <div className="w-1 shrink-0" style={{ backgroundColor: colorHex }} />
                <div className="p-3 w-full relative">
                  <div className={`${template.use_thumbnail ? "pr-24" : ""}`}>
                    {/* Author Section */}
                    {template.author_name && (
                      <div className="flex items-center gap-2 mb-2">
                        {template.author_icon_url && <div className="w-6 h-6 rounded-full bg-default-300 shrink-0" />}
                        <span className="text-sm font-medium text-white">{template.author_name}</span>
                      </div>
                    )}

                    {/* Title */}
                    {template.title && <div className="font-semibold text-white mb-2">{template.title}</div>}

                    {/* Description if any */}
                    {template.content && <div className="text-[#D1D3D7] text-sm mb-2">{template.content}</div>}

                    {/* Fields Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {fields.map((field, index) => (
                        <div key={index} className={`${field.inline ? "" : "col-span-2"} min-w-0`}>
                          <div className="text-[#D1D3D7] text-xs font-medium mb-0.5">{field.name || "Field Name"}</div>
                          <div className="text-[#989AA2] text-sm break-words">{field.value || "Field Value"}</div>
                        </div>
                      ))}
                    </div>

                    {/* Footer Section */}
                    {(template.footer_text || template.include_timestamp) && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#393B40]">
                        {template.footer_icon_url && <div className="w-5 h-5 rounded-full bg-default-300 shrink-0" />}
                        <span className="text-xs text-[#989AA2] flex items-center gap-2">
                          {template.footer_text}
                          {template.include_timestamp && (
                            <>
                              {template.footer_text && "•"}
                              {new Date().toLocaleString()}
                            </>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail */}
                  {template.use_thumbnail && (
                    <div className="absolute top-3 right-3">
                      <div className="w-16 h-16 rounded bg-[#1E1F22] flex items-center justify-center text-xs text-[#989AA2]">Mod Icon</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[#D1D3D7] whitespace-pre-wrap">{template.content || "No content set"}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default function DiscordPreview({ template, fields }) {
  return (
    <div className="h-full">
      <div className="sticky top-4 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-primary" />
          <h3 className="text-sm font-medium">Live Preview</h3>
        </div>
        <div className="relative max-h-[calc(100vh-8rem)] overflow-y-auto">
          <ScrollShadow className="h-full">
            <div className="bg-[#313338] rounded-lg">
              <PreviewEmbed template={template} fields={fields} />
            </div>
          </ScrollShadow>
        </div>
      </div>
    </div>
  );
}
