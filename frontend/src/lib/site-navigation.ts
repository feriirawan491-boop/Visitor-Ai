export const definitionViews=['entertaint','protocol'] as const;
export type DefinitionView=typeof definitionViews[number];
export function isDefinitionView(view:string):view is DefinitionView{return definitionViews.some(v=>v===view);}
export const definitionNames:Record<DefinitionView,string>={entertaint:'Entertaint',protocol:'Protocol'};
