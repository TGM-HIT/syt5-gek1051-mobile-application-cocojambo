import { createPinia } from 'pinia'
import QrScanner from '../../src/views/QrScanner.vue'
import * as zxing from '@zxing/browser'

function mountScanner(onScanned = () => {}, onClose = () => {}) {
  const pinia = createPinia()
  cy.stub(zxing.BrowserMultiFormatReader.prototype, 'decodeFromVideoDevice').resolves()
  cy.stub(zxing.BrowserMultiFormatReader, 'releaseAllStreams')
  cy.mount(QrScanner, {
    global: { plugins: [pinia] },
    attrs: {
      onScanned,
      onClose,
    },
  })
}

describe('QrScanner', () => {
  it('renders scanner UI with title and cancel button', () => {
    mountScanner()
    cy.get('[data-cy="qr-scanner"]').should('exist')
    cy.contains('QR-Code scannen').should('be.visible')
    cy.contains('Abbrechen').should('be.visible')
  })

  it('emits close when cancel button clicked', () => {
    const onClose = cy.spy().as('close')
    mountScanner(() => {}, onClose)
    cy.contains('Abbrechen').click()
    cy.get('@close').should('have.been.calledOnce')
  })

  it('releases streams on close', () => {
    mountScanner()
    cy.contains('Abbrechen').click()
    cy.then(() => {
      expect(zxing.BrowserMultiFormatReader.releaseAllStreams).to.have.been.called
    })
  })

  it('starts video decoder on mount', () => {
    mountScanner()
    cy.then(() => {
      expect(zxing.BrowserMultiFormatReader.prototype.decodeFromVideoDevice).to.have.been.calledOnce
    })
  })

  it('shows status message after camera starts', () => {
    mountScanner()
    cy.contains('QR-Code ins Bild halten...').should('be.visible')
  })
})

describe('QrScanner – normalize logic (via decode callback)', () => {
  it('accepts valid 6-char share code', () => {
    const onScanned = cy.spy().as('scanned')
    const pinia = createPinia()
    cy.stub(zxing.BrowserMultiFormatReader, 'releaseAllStreams')
    cy.stub(zxing.BrowserMultiFormatReader.prototype, 'decodeFromVideoDevice').callsFake(
      (deviceId, videoEl, callback) => {
        setTimeout(() => callback({ getText: () => 'ABC234' }, null), 50)
        return Promise.resolve()
      },
    )
    cy.mount(QrScanner, {
      global: { plugins: [pinia] },
      attrs: { onScanned, onClose: () => {} },
    })
    cy.get('@scanned').should('have.been.calledWith', 'ABC234')
  })

  it('normalizes lowercase to uppercase', () => {
    const onScanned = cy.spy().as('scanned')
    const pinia = createPinia()
    cy.stub(zxing.BrowserMultiFormatReader, 'releaseAllStreams')
    cy.stub(zxing.BrowserMultiFormatReader.prototype, 'decodeFromVideoDevice').callsFake(
      (deviceId, videoEl, callback) => {
        setTimeout(() => callback({ getText: () => 'abc234' }, null), 50)
        return Promise.resolve()
      },
    )
    cy.mount(QrScanner, {
      global: { plugins: [pinia] },
      attrs: { onScanned, onClose: () => {} },
    })
    cy.get('@scanned').should('have.been.calledWith', 'ABC234')
  })

  it('extracts code from URL with ?join= parameter', () => {
    const onScanned = cy.spy().as('scanned')
    const pinia = createPinia()
    cy.stub(zxing.BrowserMultiFormatReader, 'releaseAllStreams')
    cy.stub(zxing.BrowserMultiFormatReader.prototype, 'decodeFromVideoDevice').callsFake(
      (deviceId, videoEl, callback) => {
        setTimeout(() => callback({ getText: () => 'https://example.com/app?join=XYZ789' }, null), 50)
        return Promise.resolve()
      },
    )
    cy.mount(QrScanner, {
      global: { plugins: [pinia] },
      attrs: { onScanned, onClose: () => {} },
    })
    cy.get('@scanned').should('have.been.calledWith', 'XYZ789')
  })

  it('rejects codes with ambiguous characters (O, 0, I, 1)', () => {
    const onScanned = cy.spy().as('scanned')
    const pinia = createPinia()
    cy.stub(zxing.BrowserMultiFormatReader, 'releaseAllStreams')
    cy.stub(zxing.BrowserMultiFormatReader.prototype, 'decodeFromVideoDevice').callsFake(
      (deviceId, videoEl, callback) => {
        setTimeout(() => callback({ getText: () => 'OO0II1' }, null), 50)
        return Promise.resolve()
      },
    )
    cy.mount(QrScanner, {
      global: { plugins: [pinia] },
      attrs: { onScanned, onClose: () => {} },
    })
    cy.contains('Kein gültiger Share-Code erkannt').should('be.visible')
    cy.get('@scanned').should('not.have.been.called')
  })

  it('rejects random text that is not a share code', () => {
    const onScanned = cy.spy().as('scanned')
    const pinia = createPinia()
    cy.stub(zxing.BrowserMultiFormatReader, 'releaseAllStreams')
    cy.stub(zxing.BrowserMultiFormatReader.prototype, 'decodeFromVideoDevice').callsFake(
      (deviceId, videoEl, callback) => {
        setTimeout(() => callback({ getText: () => 'hello world' }, null), 50)
        return Promise.resolve()
      },
    )
    cy.mount(QrScanner, {
      global: { plugins: [pinia] },
      attrs: { onScanned, onClose: () => {} },
    })
    cy.contains('Kein gültiger Share-Code erkannt').should('be.visible')
    cy.get('@scanned').should('not.have.been.called')
  })
})
