/**
 * src/components/CategoricalSection.tsx
 *
 * Wrapper component for Phase 5 (Categorical Relationships).
 */

import { Tags, Info } from "lucide-react";
import type { CategoricalResult } from "@/types/dataset";
import CatCatTable from "./CatCatTable";
import CatNumExplorer from "./CatNumExplorer";

interface CategoricalSectionProps {
  categorical?: CategoricalResult;
}

export default function CategoricalSection({ categorical }: CategoricalSectionProps) {
  if (!categorical) return null;

  const { 
    cat_columns_analyzed, 
    num_columns_analyzed, 
    skipped_columns, 
    info_messages, 
    cat_cat_pairs, 
    top_cat_cat, 
    cat_num_pairs 
  } = categorical;

  if (cat_columns_analyzed.length === 0) {
    return (
      <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-8 text-center mt-4 border-t">
        <Tags className="w-8 h-8 text-slate-300 mx-auto mb-3" />
        <h3 className="text-[15px] font-semibold text-navy mb-1">No categorical columns found</h3>
        <p className="text-[13px] text-slate-500 max-w-md mx-auto">
          Categorical relationship analysis requires at least one valid text/boolean column.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 mt-4 pt-8 border-t border-slate-200">
      
      {/* Header */}
      <div className="flex items-center gap-2">
        <Tags className="w-5 h-5 text-accent" />
        <h2 className="text-[17px] font-semibold text-navy">Categorical Relationships</h2>
      </div>

      {/* Info messages */}
      {(info_messages.length > 0 || skipped_columns.length > 0) && (
        <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100 flex items-start gap-3 text-[13px] text-slate-600">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            {info_messages.map((msg, i) => (
              <p key={`info-${i}`}>{msg}</p>
            ))}
            {skipped_columns.length > 0 && (
              <p>
                <span className="font-medium text-slate-700">Skipped columns: </span>
                {skipped_columns.map(sc => `${sc.name} (${sc.reason})`).join(", ")}.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Cat-Cat Analysis */}
      {cat_cat_pairs.length > 0 ? (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <CatCatTable pairs={cat_cat_pairs} topPairs={top_cat_cat} />
          </div>
          
          {/* How to read this */}
          <div className="w-full lg:w-72 shrink-0">
            <h3 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-3">How to read this</h3>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4 text-[13px] text-slate-600">
              <div>
                <strong className="text-navy block mb-0.5">Cramér's V</strong>
                <p>Measures association between two categorical features (0 to 1). 0 means completely independent, 1 means perfectly associated.</p>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <strong className="text-navy block mb-0.5">Eta-Squared (η²)</strong>
                <p>Shows what proportion of the variance in a numerical feature is explained by a categorical feature. Higher means the category strongly influences the number.</p>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <p className="text-slate-500 italic">Note: Association does not imply causation.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-[13px] text-slate-500">Need at least two categorical columns for category-to-category associations.</p>
      )}

      {/* Cat-Num Explorer */}
      {num_columns_analyzed.length > 0 && cat_num_pairs.length > 0 && (
        <CatNumExplorer 
          pairs={cat_num_pairs} 
          catColumns={cat_columns_analyzed} 
          numColumns={num_columns_analyzed} 
        />
      )}

    </div>
  );
}

