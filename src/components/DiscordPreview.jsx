"use client";

import { ScrollShadow } from "@nextui-org/react";
import { MessageSquare } from "lucide-react";

const PreviewEmbed = ({ template, fields }) => {
  const colorHex = `#${template.color.toString(16).padStart(6, "0")}`;

  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: "#2d313f" }}>
      <div className="space-y-3">
        <div className="pl-4 border-l-4 rounded bg-slate-800 py-3" style={{ borderColor: colorHex }}>
          {/* Author Section */}
          {template.author_name && (
            <div className="flex items-center gap-2 mb-2">
              {template.author_icon_url && <div className="w-6 h-6 rounded-full bg-default-300" />}
              <span className="text-sm text-default-800">{template.author_name}</span>
            </div>
          )}

          {/* Main Content */}

          <div className="text-default-800 font-medium mb-3">{template.title}</div>
          <div className="grid grid-cols-2 gap-4">
            {fields.map((field, index) => (
              <div key={index} className={field.inline ? "" : "col-span-2"}>
                <div className="text-default-800 text-xs font-medium mb-1">{field.name || "Field Name"}</div>
                <div className="text-default-500 text-sm">{field.value || "Field Value"}</div>
              </div>
            ))}
          </div>

          {/* Footer Section */}
          {(template.footer_text || template.include_timestamp) && (
            <div className="flex items-center gap-2 mt-2">
              {template.footer_icon_url && <div className="w-5 h-5 rounded-full bg-default-300" />}
              <span className="text-xs text-default-900">
                {template.footer_text}
                {template.include_timestamp && (
                  <>
                    {template.footer_text && " • "}
                    {new Date().toLocaleString()}
                  </>
                )}
              </span>
            </div>
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
            {template.use_embed ? (
              <PreviewEmbed template={template} fields={fields} />
            ) : (
              <div className="border rounded-lg p-4 bg-[#313338]">
                <p className="text-default-200 whitespace-pre-wrap">{template.content || "No content set"}</p>
              </div>
            )}
          </ScrollShadow>
        </div>
      </div>
    </div>
  );
}
