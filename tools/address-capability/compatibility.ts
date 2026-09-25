/** Exact reviewed nontransactional profiles. No semver range or transaction adapter. */
export const CONNECTOR_PROFILES = Object.freeze({
  '4.0.0': Object.freeze({ tagCommit: '91044d7ba8e50bb1f2d67f95c8c3d1f8642727b8', signatureBytes: 64, verifyingKeyBytes: 32 }),
  '4.0.1': Object.freeze({ tagCommit: 'e1ac4e746ced0b60d26ef23e379476c5db9ea2bc', signatureBytes: 64, verifyingKeyBytes: 32 }),
});
export function reviewedVersion(version: string): boolean {
  return Object.hasOwn(CONNECTOR_PROFILES, version);
}
export type ConnectShape = 'OWN_DATA_FUNCTION' | 'INHERITED_DATA_FUNCTION' | 'OWN_ACCESSOR' | 'INHERITED_ACCESSOR'
  | 'OWN_NONCALLABLE' | 'INHERITED_NONCALLABLE' | 'OWN_UNREADABLE_ACCESSOR' | 'INHERITED_UNREADABLE_ACCESSOR' | 'ABSENT' | 'UNINSPECTABLE';
export type CompatibilityReason = 'API_VERSION_UNREVIEWED' | 'CONNECT_METHOD_NOT_DISCOVERABLE'
  | 'CONNECT_REQUIRES_CLICK_RESOLUTION' | 'READY_FOR_EXPLICIT_CONNECT' | 'DUPLICATE_IDENTIFIERS';
export interface ConnectInspection { shape: ConnectShape; eligible: boolean; accessor: boolean; owner?: object; descriptor?: PropertyDescriptor }
/** Descriptor inspection only: never evaluate a property getter or resolve through a Proxy get trap. */
export function inspectConnect(target: object): ConnectInspection {
  try {
    let current: object | null = target;
    const seen = new Set<object>();
    for (let depth=0; current !== null && depth<16; depth++) {
      if(seen.has(current)) return {shape:'UNINSPECTABLE',eligible:false,accessor:false};
      seen.add(current);
      const descriptor = Object.getOwnPropertyDescriptor(current,'connect');
      if(descriptor) {
        const own=current===target;
        if('value' in descriptor) {
          const eligible=typeof descriptor.value==='function';
          return {shape:eligible ? (own?'OWN_DATA_FUNCTION':'INHERITED_DATA_FUNCTION') : (own?'OWN_NONCALLABLE':'INHERITED_NONCALLABLE'),eligible,accessor:false,owner:current,descriptor};
        }
        const eligible=typeof descriptor.get==='function';
        return {shape:eligible ? (own?'OWN_ACCESSOR':'INHERITED_ACCESSOR') : (own?'OWN_UNREADABLE_ACCESSOR':'INHERITED_UNREADABLE_ACCESSOR'),eligible,accessor:true,owner:current,descriptor};
      }
      current=Object.getPrototypeOf(current);
    }
    return {shape:current===null?'ABSENT':'UNINSPECTABLE',eligible:false,accessor:false};
  } catch { return {shape:'UNINSPECTABLE',eligible:false,accessor:false}; }
}
export function sameConnect(a: ConnectInspection,b: ConnectInspection): boolean {
  return a.shape===b.shape && a.owner===b.owner && a.descriptor?.value===b.descriptor?.value
    && a.descriptor?.get===b.descriptor?.get && a.descriptor?.set===b.descriptor?.set;
}
