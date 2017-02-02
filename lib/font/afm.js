'use strict'

const PDFName = require('../object/name')
const PDFObject = require('../object/object')
const PDFString = require('../object/string')
const PDFArray = require('../object/array')

module.exports = class AFMFont {
  constructor(data) {

    this._data = data

    // TODO: font id!
    this.alias = new PDFName('F' + 1)

    this.object = new PDFObject('Font')

    // TODO
    this.unitsPerEm = 2048
  }

  encode(str) {
    let encoded = ''
    for (let i = 0, len = str.length; i < len; ++i) {
      switch (str[i]) {
      case '\\':
        encoded += '\\\\'
        break
      case '(':
        encoded += '\\('
        break
      case ')':
        encoded += '\\)'
        break
      default:
        encoded += String.fromCharCode(this._charCodeFor(str[i]))
      }
    }

    return '(' + encoded + ')'
  }

  _charCodeFor(c) {
    return c in UNICODE_TO_WIN1252
      ? UNICODE_TO_WIN1252[c]
      : c.charCodeAt(0)
  }

  stringWidth(str, size) {
    const scale  = size / this.unitsPerEm

    let width = 0
    for (let i = 0, len = str.length; i < len; ++i) {
      const left = this._charCodeFor(str[i])
      // const right = str.charCodeAt(i + 1)

      const advanceWidth = this._data.widths[left]

      if (advanceWidth) {
        width += advanceWidth
      }

      // TODO: kerning
      // if (!isNaN(right)) {
      //   width += this.font.getKerningValue(left, right)
      // }
    }

    return width * scale
  }

  lineHeight(size, includeGap) {
    if (includeGap == null) {
      includeGap = false
    }

    const gap = includeGap ? this._data.capHeight : 0
    const ascent = this._data.ascender
    const descent = this._data.descender

    return (ascent + gap - descent) * size / this.unitsPerEm
  }

  lineDescent(size) {
    return this._data.descender * size / this.unitsPerEm
  }

  async write(doc) {
    const scaleFactor = 1000.0 / this.unitsPerEm

    const descriptor = new PDFObject('FontDescriptor')
    descriptor.prop('FontName', this._data.fontName)
    descriptor.prop('FontBBox', new PDFArray(this._data.fontBBox))
    descriptor.prop('ItalicAngle', this._data.italicAngle)
    descriptor.prop('Ascent', this._data.ascender * scaleFactor)
    descriptor.prop('Descent', this._data.descender * scaleFactor)
    descriptor.prop('XHeight', this._data.xHeight * scaleFactor)
    descriptor.prop('CapHeight', this._data.capHeight * scaleFactor)
    descriptor.prop('StemV', 0)

    this.object.prop('Subtype', 'Type1')
    this.object.prop('BaseFont', this._data.familyName)
    this.object.prop('Encoding', 'WinAnsiEncoding')
    this.object.prop('FontDescriptor', descriptor.toReference())

    await doc._writeObject(descriptor)
    await doc._writeObject(this.object)
  }
}

// only the once different from ISO-8859-1 are relevant, see
// https://en.wikipedia.org/wiki/Windows-1252
const UNICODE_TO_WIN1252 = {
  '\u20ac': 128,
  '\u201a': 130,
  '\u0192': 131,
  '\u201e': 132,
  '\u2026': 133,
  '\u2020': 134,
  '\u2021': 135,
  '\u02c6': 136,
  '\u2030': 137,
  '\u0160': 138,
  '\u2039': 139,
  '\u0152': 140,
  '\u017d': 142,
  '\u2018': 145,
  '\u2019': 146,
  '\u201c': 147,
  '\u201d': 148,
  '\u2022': 149,
  '\u2013': 150,
  '\u2014': 151,
  '\u02dc': 152,
  '\u2122': 153,
  '\u0161': 154,
  '\u203a': 155,
  '\u0153': 156,
  '\u017e': 158,
  '\u0178': 159
}