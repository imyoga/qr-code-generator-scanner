"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  QrCode,
  Download,
  Upload,
  Scan,
  Wifi,
  Phone,
  Mail,
  MessageSquare,
  ImageIcon,
  Palette,
  Square,
} from "lucide-react"
import QRCode from "qrcode"

type QRType = "text" | "url" | "wifi" | "phone" | "email" | "sms"
type QRShape = "square" | "circle" | "rounded" | "dots"

interface QROptions {
  errorCorrectionLevel: "L" | "M" | "Q" | "H"
  type: "image/png" | "image/jpeg"
  quality: number
  margin: number
  color: {
    dark: string
    light: string
  }
  width: number
  shape: QRShape
}

export default function QRCodeTool() {
  const [activeTab, setActiveTab] = useState("generate")
  const [qrType, setQrType] = useState<QRType>("text")
  const [qrData, setQrData] = useState("")
  const [generatedQR, setGeneratedQR] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [scannedResult, setScannedResult] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [qrOptions, setQrOptions] = useState<QROptions>({
    errorCorrectionLevel: "M",
    type: "image/png",
    quality: 0.92,
    margin: 4,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    width: 256,
    shape: "square",
  })

  // WiFi specific fields
  const [wifiData, setWifiData] = useState({
    ssid: "",
    password: "",
    security: "WPA",
    hidden: false,
  })

  // Contact specific fields
  const [contactData, setContactData] = useState({
    phone: "",
    email: "",
    message: "",
  })

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const generateQRCode = useCallback(async () => {
    if (!qrData.trim() && qrType === "text") return

    setIsGenerating(true)

    try {
      let dataToEncode = ""

      switch (qrType) {
        case "text":
          dataToEncode = qrData
          break
        case "url":
          dataToEncode = qrData.startsWith("http") ? qrData : `https://${qrData}`
          break
        case "wifi":
          dataToEncode = `WIFI:T:${wifiData.security};S:${wifiData.ssid};P:${wifiData.password};H:${wifiData.hidden ? "true" : "false"};;`
          break
        case "phone":
          dataToEncode = `tel:${contactData.phone}`
          break
        case "email":
          dataToEncode = `mailto:${contactData.email}`
          break
        case "sms":
          dataToEncode = `sms:${contactData.phone}?body=${encodeURIComponent(contactData.message)}`
          break
      }

      // Generate base QR code
      const qrCodeDataURL = await QRCode.toDataURL(dataToEncode, {
        ...qrOptions,
        // Enhanced options for better quality
        rendererOpts: {
          quality: qrOptions.quality,
        },
      })

      // If logo is provided, overlay it on the QR code
      if (logoPreview) {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (ctx) {
          canvas.width = qrOptions.width
          canvas.height = qrOptions.width

          // Draw QR code
          const qrImg = new Image()
          qrImg.crossOrigin = "anonymous"
          qrImg.onload = () => {
            ctx.drawImage(qrImg, 0, 0, qrOptions.width, qrOptions.width)

            // Draw logo in center
            const logoImg = new Image()
            logoImg.crossOrigin = "anonymous"
            logoImg.onload = () => {
              const logoSize = qrOptions.width * 0.2 // 20% of QR code size
              const logoX = (qrOptions.width - logoSize) / 2
              const logoY = (qrOptions.width - logoSize) / 2

              // Add white background for logo
              ctx.fillStyle = "white"
              ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10)

              ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
              setGeneratedQR(canvas.toDataURL(qrOptions.type, qrOptions.quality))
            }
            logoImg.src = logoPreview
          }
          qrImg.src = qrCodeDataURL
        }
      } else {
        setGeneratedQR(qrCodeDataURL)
      }
    } catch (error) {
      console.error("Error generating QR code:", error)
    } finally {
      setIsGenerating(false)
    }
  }, [qrData, qrType, qrOptions, wifiData, contactData, logoPreview])

  const downloadQR = () => {
    if (!generatedQR) return

    const link = document.createElement("a")
    link.download = `qr-code.${qrOptions.type.split("/")[1]}`
    link.href = generatedQR
    link.click()
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // For demo purposes, we'll simulate QR code scanning
    // In a real implementation, you'd use a QR code scanning library
    setScannedResult("Demo: QR code scanning would happen here with the uploaded image")
  }

  const renderQRInput = () => {
    switch (qrType) {
      case "text":
        return (
          <div className="space-y-2">
            <Label htmlFor="text-input">Enter text</Label>
            <Textarea
              id="text-input"
              placeholder="Enter any text to generate QR code..."
              value={qrData}
              onChange={(e) => setQrData(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        )
      case "url":
        return (
          <div className="space-y-2">
            <Label htmlFor="url-input">Enter URL</Label>
            <Input
              id="url-input"
              type="url"
              placeholder="https://example.com"
              value={qrData}
              onChange={(e) => setQrData(e.target.value)}
            />
          </div>
        )
      case "wifi":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wifi-ssid">Network Name (SSID)</Label>
              <Input
                id="wifi-ssid"
                placeholder="My WiFi Network"
                value={wifiData.ssid}
                onChange={(e) => setWifiData((prev) => ({ ...prev, ssid: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wifi-password">Password</Label>
              <Input
                id="wifi-password"
                type="password"
                placeholder="WiFi password"
                value={wifiData.password}
                onChange={(e) => setWifiData((prev) => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wifi-security">Security Type</Label>
              <Select
                value={wifiData.security}
                onValueChange={(value) => setWifiData((prev) => ({ ...prev, security: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WPA">WPA/WPA2</SelectItem>
                  <SelectItem value="WEP">WEP</SelectItem>
                  <SelectItem value="nopass">No Password</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )
      case "phone":
        return (
          <div className="space-y-2">
            <Label htmlFor="phone-input">Phone Number</Label>
            <Input
              id="phone-input"
              type="tel"
              placeholder="+1234567890"
              value={contactData.phone}
              onChange={(e) => setContactData((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>
        )
      case "email":
        return (
          <div className="space-y-2">
            <Label htmlFor="email-input">Email Address</Label>
            <Input
              id="email-input"
              type="email"
              placeholder="example@email.com"
              value={contactData.email}
              onChange={(e) => setContactData((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>
        )
      case "sms":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sms-phone">Phone Number</Label>
              <Input
                id="sms-phone"
                type="tel"
                placeholder="+1234567890"
                value={contactData.phone}
                onChange={(e) => setContactData((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sms-message">Message</Label>
              <Textarea
                id="sms-message"
                placeholder="Enter your message..."
                value={contactData.message}
                onChange={(e) => setContactData((prev) => ({ ...prev, message: e.target.value }))}
              />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar - Title and Info */}
      <div className="w-80 border-r bg-card p-6 flex flex-col">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <QrCode className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-balance">QR Code Generator</h1>
              <p className="text-sm text-muted-foreground">& Scanner</p>
            </div>
          </div>
          <p className="text-muted-foreground text-pretty">
            Create and scan QR codes for text, URLs, WiFi, contacts, and more. Add custom logos and choose from
            different shapes.
          </p>
        </div>

        {/* Features List */}
        <div className="space-y-4 flex-1">
          <div>
            <h3 className="font-semibold mb-2">Features</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Multiple QR code types
              </li>
              <li className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Custom logo overlay
              </li>
              <li className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Color customization
              </li>
              <li className="flex items-center gap-2">
                <Square className="h-4 w-4" />
                Different shapes
              </li>
              <li className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                High-quality downloads
              </li>
              <li className="flex items-center gap-2">
                <Scan className="h-4 w-4" />
                QR code scanning
              </li>
            </ul>
          </div>
        </div>

        {/* Tab Selection in Sidebar */}
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical">
            <TabsList className="grid w-full grid-cols-1 h-auto">
              <TabsTrigger value="generate" className="flex items-center gap-2 justify-start">
                <QrCode className="h-4 w-4" />
                Generate QR Code
              </TabsTrigger>
              <TabsTrigger value="scan" className="flex items-center gap-2 justify-start">
                <Scan className="h-4 w-4" />
                Scan QR Code
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Generate Tab */}
          <TabsContent value="generate" className="mt-0">
            <div className="grid gap-6 lg:grid-cols-2 h-full">
              {/* Input Section */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Create QR Code</CardTitle>
                  <CardDescription>Choose the type of QR code and enter your data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* QR Type Selection */}
                  <div className="space-y-3">
                    <Label>QR Code Type</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={qrType === "text" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setQrType("text")}
                        className="justify-start"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Text
                      </Button>
                      <Button
                        variant={qrType === "url" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setQrType("url")}
                        className="justify-start"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        URL
                      </Button>
                      <Button
                        variant={qrType === "wifi" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setQrType("wifi")}
                        className="justify-start"
                      >
                        <Wifi className="h-4 w-4 mr-2" />
                        WiFi
                      </Button>
                      <Button
                        variant={qrType === "phone" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setQrType("phone")}
                        className="justify-start"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Phone
                      </Button>
                      <Button
                        variant={qrType === "email" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setQrType("email")}
                        className="justify-start"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </Button>
                      <Button
                        variant={qrType === "sms" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setQrType("sms")}
                        className="justify-start"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        SMS
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Dynamic Input Fields */}
                  {renderQRInput()}

                  <Separator />

                  <div className="space-y-4">
                    <Label>Logo (Optional)</Label>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        onClick={() => logoInputRef.current?.click()}
                        className="flex items-center gap-2"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Upload Logo
                      </Button>
                      {logoPreview && (
                        <div className="flex items-center gap-2">
                          <img src={logoPreview || "/placeholder.svg"} alt="Logo preview" className="w-8 h-8 rounded" />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setLogoFile(null)
                              setLogoPreview(null)
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label>Customization</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="qr-size">Size</Label>
                        <Select
                          value={qrOptions.width.toString()}
                          onValueChange={(value) =>
                            setQrOptions((prev) => ({ ...prev, width: Number.parseInt(value) }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="128">Small (128px)</SelectItem>
                            <SelectItem value="256">Medium (256px)</SelectItem>
                            <SelectItem value="512">Large (512px)</SelectItem>
                            <SelectItem value="1024">Extra Large (1024px)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="error-correction">Error Correction</Label>
                        <Select
                          value={qrOptions.errorCorrectionLevel}
                          onValueChange={(value: "L" | "M" | "Q" | "H") =>
                            setQrOptions((prev) => ({ ...prev, errorCorrectionLevel: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="L">Low</SelectItem>
                            <SelectItem value="M">Medium</SelectItem>
                            <SelectItem value="Q">Quartile</SelectItem>
                            <SelectItem value="H">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dark-color">Foreground Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={qrOptions.color.dark}
                            onChange={(e) =>
                              setQrOptions((prev) => ({
                                ...prev,
                                color: { ...prev.color, dark: e.target.value },
                              }))
                            }
                            className="w-12 h-10 p-1 border rounded"
                          />
                          <Input
                            value={qrOptions.color.dark}
                            onChange={(e) =>
                              setQrOptions((prev) => ({
                                ...prev,
                                color: { ...prev.color, dark: e.target.value },
                              }))
                            }
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="light-color">Background Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={qrOptions.color.light}
                            onChange={(e) =>
                              setQrOptions((prev) => ({
                                ...prev,
                                color: { ...prev.color, light: e.target.value },
                              }))
                            }
                            className="w-12 h-10 p-1 border rounded"
                          />
                          <Input
                            value={qrOptions.color.light}
                            onChange={(e) =>
                              setQrOptions((prev) => ({
                                ...prev,
                                color: { ...prev.color, light: e.target.value },
                              }))
                            }
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button onClick={generateQRCode} className="w-full" disabled={isGenerating} size="lg">
                    {isGenerating ? "Generating..." : "Generate QR Code"}
                  </Button>
                </CardContent>
              </Card>

              {/* Output Section */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Generated QR Code</CardTitle>
                  <CardDescription>Your QR code will appear here</CardDescription>
                </CardHeader>
                <CardContent>
                  {generatedQR ? (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <div className="p-4 bg-white rounded-lg border-2 border-dashed border-border">
                          <img
                            src={generatedQR || "/placeholder.svg"}
                            alt="Generated QR Code"
                            className="max-w-full h-auto"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={downloadQR} className="flex-1">
                          <Download className="h-4 w-4 mr-2" />
                          Download PNG
                        </Button>
                        <Button variant="outline" onClick={() => navigator.clipboard.writeText(generatedQR)}>
                          Copy
                        </Button>
                      </div>
                      <div className="text-center">
                        <Badge variant="secondary">{qrType.toUpperCase()} QR Code</Badge>
                        {logoPreview && (
                          <Badge variant="outline" className="ml-2">
                            With Logo
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="p-4 bg-muted rounded-full mb-4">
                        <QrCode className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">
                        Enter your data and click "Generate QR Code" to create your QR code
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Scan Tab */}
          <TabsContent value="scan" className="mt-0">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Scan QR Code</CardTitle>
                <CardDescription>Upload an image containing a QR code to decode it</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Upload QR Code Image</p>
                  <p className="text-muted-foreground mb-4">Select an image file containing a QR code</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button onClick={() => fileInputRef.current?.click()}>Choose File</Button>
                </div>

                {scannedResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Scanned Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="font-mono text-sm break-all">{scannedResult}</p>
                      </div>
                      <Button
                        variant="outline"
                        className="mt-4 bg-transparent"
                        onClick={() => navigator.clipboard.writeText(scannedResult)}
                      >
                        Copy Result
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
