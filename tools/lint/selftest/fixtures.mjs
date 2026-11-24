/**
 * Fixture projects for the lint self-test.
 * `good` must pass every check. `bad` must trigger every rule listed in `expected`.
 * The self-test writes these files to .lint-selftest/ and removes them afterwards.
 */

import config from '../standards.config.mjs';

/** App ID prefix from the kit settings (UI-03), so the fixtures follow a prefix change. */
const prefix = config.appIdPrefix;
const prefixPath = prefix.replaceAll('.', '/');

const j = (o) => JSON.stringify(o, null, 2) + '\n';

const tsconfig = j({
  compilerOptions: {
    strict: true,
    target: 'ES2023',
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
    noImplicitOverride: true,
    noEmit: true,
    skipLibCheck: true,
    types: ['node', 'jest', '@cap-js/cds-types'],
  },
  include: ['srv', 'test'],
});

const appTsconfig = (app) =>
  j({
    compilerOptions: {
      target: 'ES2023',
      module: 'ES2022',
      moduleResolution: 'Bundler',
      strict: true,
      strictPropertyInitialization: false,
      skipLibCheck: true,
      noEmit: true,
      rootDir: './webapp',
      types: ['@sapui5/types'],
      paths: { [`${prefixPath}/${app}/*`]: ['./webapp/*'] },
    },
    include: ['./webapp/**/*'],
  });

/* ------------------------------------------------------------------ good */

export const good = {
  'package.json': j({
    name: 'closeworkspace',
    version: '1.0.0',
    private: true,
    engines: { node: '>=24' },
    dependencies: { '@sap/cds': '^10' },
  }),
  '.gitignore': 'node_modules/\ngen/\ndefault-env.json\n.env\n.cdsrc-private.json\n',
  'tsconfig.json': tsconfig,
  'mta.yaml': `_schema-version: '3.3'
ID: closeworkspace
version: 1.0.0
modules:
  - name: closeworkspace-srv
    type: nodejs
    path: gen/srv
resources:
  - name: closeworkspace-db
    type: com.sap.xs.hdi-container
    parameters:
      service-name: closeworkspace-db
`,
  'xs-security.json': j({
    xsappname: 'closeworkspace',
    scopes: [{ name: '$XSAPPNAME.Controller', description: 'Work on a close and decide on proposals' }],
    'role-templates': [{ name: 'Controller', 'scope-references': ['$XSAPPNAME.Controller'] }],
    'role-collections': [{ name: 'Close Workspace Controller', 'role-template-references': ['$XSAPPNAME.Controller'] }],
  }),

  'db/schema.cds': `namespace closeworkspace;

using { cuid, managed } from '@sap/cds/common';

type RunStatus      : String enum { PLANNING; RUNNING; WAITING_FOR_DECISION; COMPLETED; }
type ProposalStatus : String enum { PENDING; APPROVED; REJECTED; }

entity Runs : cuid, managed {
  title       : String(120);
  goalText    : String(500);
  companyCode : String(4);
  status      : RunStatus;
  isScripted  : Boolean default false;
  proposals   : Composition of many Proposals on proposals.run = $self;
}

entity Proposals : cuid {
  run      : Association to Runs;
  title    : String(120);
  amount   : Decimal(15, 2);
  currency : String(3);
  status   : ProposalStatus;
}

entity Settings {
  key code        : String(40);
      description : String(200);
      content     : String(1000);
}
`,
  'db/data/closeworkspace-Settings.csv': 'code;description;content\nAUTO_POST_LIMIT;Auto-post limit in EUR;25000\n',

  'srv/workspace-service.cds': `using { closeworkspace } from '../db/schema';

service WorkspaceService @(requires: 'authenticated-user') {
  @readonly entity Runs      as projection on closeworkspace.Runs;
  @readonly entity Proposals as projection on closeworkspace.Proposals;

  @(requires: 'Controller')
  action approve(proposalID : UUID) returns Proposals;
}
`,
  'srv/workspace-service.ts': `import cds from '@sap/cds';

export default class WorkspaceService extends cds.ApplicationService {
  override async init(): Promise<void> {
    this.on('approve', (req) => req.data);
    return super.init();
  }
}
`,
  'srv/governance-service.cds': `using { closeworkspace } from '../db/schema';

service GovernanceService @(requires: 'Auditor') {
  @readonly entity Settings as projection on closeworkspace.Settings;
}

annotate GovernanceService.Settings with {
  code        @title: '{i18n>setting.code}';
  description @title: '{i18n>setting.description}';
  content     @title: '{i18n>setting.content}';
}
`,
  'srv/_i18n/i18n.properties': `#XFLD: Technical key of a setting
setting.code=Setting
#XFLD: What the setting does
setting.description=Description
#XFLD: Value of the setting
setting.content=Value
`,
  'srv/ports/ledger.port.ts': `export interface JournalEntry {
  companyCode: string;
  amount: number;
  currency: string;
}

export interface LedgerPort {
  post(entry: JournalEntry): Promise<string>;
}
`,
  'srv/policy/policy-engine.ts': `import type { JournalEntry } from '../ports/ledger.port';

export type PostingDecision = 'AUTO_POST' | 'HOLD_FOR_APPROVAL';

const DEFAULT_LIMIT = 25000;

export function decidePosting(entry: JournalEntry, limit: number = DEFAULT_LIMIT): PostingDecision {
  return entry.amount <= limit ? 'AUTO_POST' : 'HOLD_FOR_APPROVAL';
}
`,
  'srv/adapters/simulated/simulated-ledger.adapter.ts': `import type { JournalEntry, LedgerPort } from '../../ports/ledger.port';

export class SimulatedLedgerAdapter implements LedgerPort {
  private counter = 0;

  post(_entry: JournalEntry): Promise<string> {
    this.counter += 1;
    return Promise.resolve(\`SIM-\${this.counter}\`);
  }
}
`,
  'srv/agents/accruals/accruals.agent.ts': `import type { JournalEntry, LedgerPort } from '../../ports/ledger.port';
import { decidePosting } from '../../policy/policy-engine';

export async function runAccrualsStep(ledger: LedgerPort, entries: JournalEntry[]): Promise<string[]> {
  const posted: string[] = [];
  for (const entry of entries) {
    if (decidePosting(entry) === 'AUTO_POST') {
      posted.push(await ledger.post(entry));
    }
  }
  return posted;
}
`,
  'test/policy/policy-engine.test.ts': `import { decidePosting } from '../../srv/policy/policy-engine';

describe('decidePosting', () => {
  it('holds an entry above the limit', () => {
    expect(decidePosting({ companyCode: '1010', amount: 48200, currency: 'EUR' })).toBe('HOLD_FOR_APPROVAL');
  });
});
`,

  'app/workspace/ui5.yaml': `specVersion: '4.0'
metadata:
  name: ${prefix}.workspace
type: application
framework:
  name: SAPUI5
  version: '1.136.0'
  libraries:
    - name: sap.m
    - name: sap.f
    - name: sap.ui.core
    - name: sap.ui.layout
`,
  'app/workspace/ui5lint.config.mjs': "export default {\n  ignores: ['dist/**'],\n};\n",
  'app/workspace/tsconfig.json': appTsconfig('workspace'),
  'app/workspace/webapp/manifest.json': j({
    _version: '2.0.0',
    'sap.app': {
      id: `${prefix}.workspace`,
      type: 'application',
      title: '{{appTitle}}',
      i18n: 'i18n/i18n.properties',
      dataSources: { mainService: { uri: '/odata/v4/workspace/', type: 'OData', settings: { odataVersion: '4.0' } } },
      crossNavigation: {
        inbounds: {
          'CloseRun-manage': {
            semanticObject: 'CloseRun',
            action: 'manage',
            signature: { parameters: {}, additionalParameters: 'allowed' },
          },
        },
      },
    },
    'sap.ui5': {
      dependencies: { minUI5Version: '1.136.0', libs: { 'sap.m': {}, 'sap.f': {}, 'sap.ui.core': {}, 'sap.ui.layout': {} } },
      contentDensities: { compact: true, cozy: true },
      models: {
        i18n: { type: 'sap.ui.model.resource.ResourceModel', settings: { bundleName: `${prefix}.workspace.i18n.i18n` } },
        '': { dataSource: 'mainService' },
      },
    },
  }),
  'app/workspace/webapp/view/Workspace.view.xml': `<mvc:View controllerName="${prefix}.workspace.controller.Workspace"
  xmlns:mvc="sap.ui.core.mvc" xmlns="sap.m" xmlns:form="sap.ui.layout.form" displayBlock="true">
  <!-- <Button text="commented out literal" style="x"/> -->
  <Page id="workspacePage" title="{i18n>workspace.title}">
    <MessageStrip id="noticeStrip" text="{i18n>workspace.notice}" type="Information" class="sapUiSmallMarginBottom"/>
    <Button id="approveButton" text="{i18n>proposal.approve}" type="Accept" icon="sap-icon://accept" press=".onApprovePress"/>
  </Page>
</mvc:View>
`,
  'app/workspace/webapp/controller/Workspace.controller.ts': `import MessageToast from 'sap/m/MessageToast';
import type ResourceBundle from 'sap/base/i18n/ResourceBundle';
import Controller from 'sap/ui/core/mvc/Controller';
import type ResourceModel from 'sap/ui/model/resource/ResourceModel';

/**
 * @namespace ${prefix}.workspace.controller
 */
export default class Workspace extends Controller {
  public onApprovePress(): void {
    const model = this.getOwnerComponent()?.getModel('i18n') as ResourceModel;
    const bundle = model.getResourceBundle() as ResourceBundle;
    MessageToast.show(bundle.getText('proposal.approved') ?? '');
  }
}
`,
  'app/workspace/webapp/i18n/i18n.properties': `#XTIT: Application title in the launchpad
appTitle=Close Workspace

#XTIT: Title of the workspace page
workspace.title=Workspace

#XMSG: Notice that this is a prototype
workspace.notice=Partner concept prototype. Not an SAP product.

#XBUT: Approve a proposal
proposal.approve=Approve

#XMSG: Confirmation after approval
proposal.approved=Proposal approved and posted
`,
};

/* ------------------------------------------------------------------- bad */

export const bad = {
  'package.json': j({
    name: 'closeworkspace',
    version: '1.0.0',
    dependencies: { '@sap/cds': '*' },
    cds: { requires: { db: { credentials: { password: 'secret123' } } } },
  }),
  '.gitignore': 'node_modules/\n',
  'tsconfig.json': tsconfig,
  'mta.yaml': `_schema-version: '3.3'
ID: CloseWS
version: 1
modules:
  - name: srv_module
    type: nodejs
resources:
  - name: closeworkspace-db
    type: com.sap.xs.hdi-container
    parameters:
      service-name: mydb
`,
  'xs-security.json': j({
    xsappname: 'cw',
    scopes: [{ name: 'controller' }],
    'role-templates': [{ name: 'controller_role' }],
    'role-collections': [{ name: 'Controllers' }],
  }),

  'db/Schema.cds': `namespace my.demo;

using { cuid } from '@sap/cds/common';

type statusCode : String enum { open; Closed; }

entity Run : cuid {
  runStatus : String;
  Goal_Text : String(100);
  status    : String(20);
  scripted  : Boolean;
  amount    : Decimal;
  proposal  : Composition of many Proposal_Items on proposal.run = $self;
}

entity Proposal_Items : cuid {
  runs  : Association to Run;
  run   : Association to Run;
  order : Integer;
}

entity logs {
  text : String(10);
}
`,
  'db/data/Runs.csv': 'ID;status\n1;OPEN\n',

  'srv/services/workspace.cds': `using { my.demo as db } from '../../db/Schema';

service workspace {
  entity Runs as projection on db.Run;
  entity Notes {
    key ID   : UUID;
        text : String(10);
  }
  action Approve_It(id : UUID);
}

service GovernanceService @(requires: 'Auditor') {
  @readonly entity Logs as projection on db.logs;
}

annotate GovernanceService.Logs with {
  text @title: 'Plain label';
}
`,
  'srv/services/handler.js': 'module.exports = {};\n',
  'srv/My_Utils/helper.ts': 'export const HELPER = 1;\n',
  'srv/policy/PolicyEngine.ts': `import cds from '@sap/cds';

interface IEntry {
  amount: number;
}

enum Decision {
  autoPost,
  hold,
}

export function decide(entry: IEntry, extra: any) {
  const max_amount = 25000;
  console.log(cds.version, extra, Date.now(), new Date());
  return entry.amount <= max_amount ? Decision.autoPost : Decision.hold;
}
`,
  'srv/policy/policy.test.ts': "export const placeholder = 'tests do not belong here';\n",
  'srv/ports/ledger.ts': `import { post } from '../adapters/simulated/ledger.adapter';

export class Ledger {
  run(): Promise<string> {
    return post();
  }
}
`,
  'srv/adapters/simulated/ledger.adapter.ts': `export async function post(): Promise<string> {
  return Promise.resolve('SIM-1');
}
`,
  'srv/agents/accruals/accruals.agent.ts': `import { OrchestrationClient } from '@sap-ai-sdk/orchestration';
import { post } from '../../adapters/simulated/ledger.adapter';

export function runAccrualsStep(): string {
  post();
  return String(OrchestrationClient) + String(process.env.LIMIT);
}
`,
  'test/policy/PolicyCheck.ts': 'export const check = 1;\n',

  'app/Admin_App/readme.txt': 'not a valid app folder name\n',
  'app/workspace/tsconfig.json': appTsconfig('workspace'),
  'app/workspace/webapp/manifest.json': j({
    'sap.app': {
      id: 'workspace',
      title: 'Close Workspace',
      dataSources: { mainService: { uri: '/odata/v2/workspace/', type: 'OData', settings: { odataVersion: '2.0' } } },
    },
    'sap.ui': { technology: 'UI5', theme: 'sap_fiori_3' },
    'sap.ui5': { dependencies: { libs: { 'sap.m': {}, 'sap.ui.table': {} } }, models: {} },
  }),
  'app/workspace/webapp/css/style.css': '.myButton { color: red; }\n',
  'app/workspace/webapp/view/workspace.view.xml': `<mvc:View xmlns:mvc="sap.ui.core.mvc" xmlns="sap.m" xmlns:t="sap.ui.table"
  xmlns:html="http://www.w3.org/1999/xhtml" xmlns:f="sap.f" xmlns:form="sap.ui.layout.form" xmlns:core="sap.ui.core">
  <f:FlexibleColumnLayout id="FCL"/>
  <Page id="Main_Page" title="Workspace">
    <Button id="btn1" text="{i18n>not.defined}" tooltip="Approve" icon="images/ok.png" press=".approve"
      class="myButton sapUiSmallMargin" style="color:red"/>
    <form:SimpleForm id="simpleForm"/>
    <core:HTML content="x"/>
  </Page>
</mvc:View>
`,
  'app/workspace/webapp/controller/Main.controller.ts': `import MessageToast from 'sap/m/MessageToast';
import Controller from 'sap/ui/core/mvc/Controller';
import { decide } from '../../../../srv/policy/PolicyEngine';

export default class Main extends Controller {
  public approve(): void {
    alert('done');
    document.title = String(decide);
    MessageToast.show('Saved');
    this.getView()?.getDomRef();
  }
}
`,
  'app/workspace/webapp/i18n/i18n.properties': `Approve_Button=Approve
#XBUT: Reject a proposal
reject.button=Reject
#XBUT: Reject a proposal again
reject.button=Reject
#XMSG: Empty
empty.text=
`,
  'app/workspace/webapp/i18n/i18n_de.properties': '#XBUT: Nur auf Deutsch\nonly.german=Nur Deutsch\n',
  'app/workspace/webapp/i18n/texts.properties': '#XTIT: Wrong file name\nsome.title=Title\n',

  'app/governance/webapp/manifest.json': j({
    'sap.app': {
      id: `${prefix}.governance`,
      title: '{{appTitle}}',
      crossNavigation: { inbounds: { nav: { semanticObject: 'agent_governance', action: 'Display' } } },
    },
    'sap.ui5': {
      dependencies: { minUI5Version: '1.136.0', libs: { 'sap.fe.templates': {} } },
      contentDensities: { compact: true, cozy: true },
      models: { i18n: { type: 'sap.ui.model.resource.ResourceModel' } },
    },
  }),
  'app/governance/webapp/i18n/i18n.properties': '#XTIT: Application title\nappTitle=Agent Governance\n',
  'app/governance/webapp/view/Extra.view.xml': '<mvc:View xmlns:mvc="sap.ui.core.mvc" xmlns="sap.m"><Page id="extraPage"/></mvc:View>\n',
};

/* -------------------------------------------------------------- expected */

/** Rules that the bad fixture must trigger, per tool. */
export const expected = {
  'check-cds-model': [
    'CDS-01',
    'CDS-02',
    'CDS-03',
    'CDS-04',
    'CDS-05',
    'CDS-06',
    'CDS-07',
    'CDS-08',
    'CDS-09',
    'CDS-10',
    'CDS-11',
    'CDS-12',
    'CDS-13',
    'CDS-14',
    'SRV-01',
    'SRV-02',
    'SRV-03',
    'SRV-04',
    'SRV-06',
    'SRV-07',
    'FILE-01',
  ],
  'check-files': ['FILE-01', 'FILE-02', 'FILE-03', 'FILE-04', 'FILE-05', 'FILE-06', 'FILE-07', 'FILE-08', 'FILE-09', 'FILE-10', 'FILE-11'],
  'check-fiori': [
    'FE-01',
    'FE-02',
    'FE-03',
    'FE-04',
    'FE-05',
    'FE-08',
    'FE-09',
    'FE-11',
    'FE-17',
    'FE-18',
    'FE-21',
    'FE-22',
    'FE-23',
    'UI-01',
    'UI-02',
    'UI-03',
    'UI-04',
  ],
  'check-i18n': ['I18N-01', 'I18N-02', 'I18N-03', 'I18N-04', 'I18N-06', 'I18N-07'],
  'check-btp': ['BTP-01', 'BTP-02', 'BTP-03', 'BTP-04', 'BTP-05', 'BTP-06', 'BTP-07'],
  eslint: [
    '@typescript-eslint/naming-convention',
    '@typescript-eslint/no-explicit-any',
    '@typescript-eslint/no-floating-promises',
    '@typescript-eslint/explicit-module-boundary-types',
    'no-console',
    'no-restricted-imports',
    'no-restricted-properties',
    'no-restricted-syntax',
    'no-restricted-globals',
    '@sap/cds/start-entities-uppercase',
  ],
};

export const commitMessages = {
  good: [
    'feat(policy): hold postings above the auto-post limit\n\nRefs: R1, INT-04\n',
    'fix(workspace): refresh the plan after a decision\n',
  ],
  bad: ['Fixed stuff', 'feat: add things', 'feat(unknown): add things', 'feat(policy): Add the rule.', 'feat(policy): ' + 'x'.repeat(80)],
};
