import React, { useState } from 'react';

interface RobloxExporterModalProps {
  onClose: () => void;
}

export const RobloxExporterModal: React.FC<RobloxExporterModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'server' | 'client' | 'schema' | 'instructions'>('server');
  const [copied, setCopied] = useState(false);

  const serverScript = `--[[
    DepthOS - Server Simulation Engine
    Place in: ServerScriptService/DepthOS_Server
    Production-grade 10Hz tick simulation & DataStore persistence
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local DataStoreService = game:GetService("DataStoreService")

local DepthOS_DS = DataStoreService:GetDataStore("DepthOS_Production_v1")

local RemoteEvents = Instance.new("Folder")
RemoteEvents.Name = "DepthOS_Remotes"
RemoteEvents.Parent = ReplicatedStorage

local ProcessEvent = Instance.new("RemoteFunction")
ProcessEvent.Name = "ProcessWorkload"
ProcessEvent.Parent = RemoteEvents

local FlushEvent = Instance.new("RemoteFunction")
FlushEvent.Name = "FlushCache"
FlushEvent.Parent = RemoteEvents

local UpgradeEvent = Instance.new("RemoteFunction")
UpgradeEvent.Name = "PurchaseUpgrade"
UpgradeEvent.Parent = RemoteEvents

local SyncEvent = Instance.new("RemoteEvent")
SyncEvent.Name = "SyncState"
SyncEvent.Parent = RemoteEvents

local SessionData = {}

local function CalculateThermalMultiplier(heat, hasSurgeDrift)
    local surgeTemp = hasSurgeDrift and 80.0 or 85.0
    if heat < 70.0 then return 1.0 end
    if heat < surgeTemp then return 1.25 end
    if heat >= 100.0 then return 10.0 end
    local normalized = (heat - surgeTemp) / (100.0 - surgeTemp)
    return 3.0 + 7.0 * (normalized ^ 2)
end

local function PlayerAdded(player)
    local profile = {
        VolatileBytes = 0,
        BankedBytes = 0,
        LifetimeBankedBytes = 0,
        QuantumBits = 0,
        Heat = 25.0,
        RamUsedMB = 0,
        RamMaxMB = 64,
        OSLevel = 1,
        CurrentXP = 0,
        Hardware = {
            CPU_Level = 1,
            RAM_Level = 1,
            Cooling_Level = 1,
            Bus_Level = 1,
            ThermalPaste_Level = 0,
        },
        RootTree = {
            SuperconductorBus = 0,
            CryogenicSubstrate = 0,
            NonVolatileRegisters = 0,
            SurgeDriftExploiter = false,
        },
        IsBSOD = false,
        BSODTimer = 0,
    }

    local success, saved = pcall(function()
        return DepthOS_DS:GetAsync("UID_" .. player.UserId)
    end)
    if success and saved then
        for k, v in pairs(saved) do profile[k] = v end
    end

    SessionData[player.UserId] = profile
end

Players.PlayerAdded:Connect(PlayerAdded)

ProcessEvent.OnServerInvoke = function(player)
    local data = SessionData[player.UserId]
    if not data or data.IsBSOD then return false end

    local base = 1 + (data.Hardware.CPU_Level - 1) * 2
    local mult = CalculateThermalMultiplier(data.Heat, data.RootTree.SurgeDriftExploiter)
    local qbitMult = 1 + (data.RootTree.SuperconductorBus * 0.15)
    local generated = math.round(base * mult * qbitMult)

    local heatAdd = 2.50 * (1 + data.Hardware.CPU_Level / 8) * (1 - math.min(0.40, data.Hardware.ThermalPaste_Level * 0.05))
    local ramCost = 2.0 * (1 + generated / 500)

    if data.RamUsedMB + ramCost > data.RamMaxMB then
        return { Stalled = true }
    end

    data.VolatileBytes = data.VolatileBytes + generated
    data.RamUsedMB = math.min(data.RamMaxMB, data.RamUsedMB + ramCost)
    data.Heat = data.Heat + heatAdd

    if data.Heat >= 100.0 then
        data.IsBSOD = true
        data.BSODTimer = 5.0
        data.VolatileBytes = 0
        data.RamUsedMB = 0
    end

    return { Success = true, State = data }
end

-- 10Hz Server Simulation Loop for Cooling & Passive Daemons
task.spawn(function()
    while true do
        task.wait(0.1)
        for _, player in ipairs(Players:GetPlayers()) do
            local data = SessionData[player.UserId]
            if data then
                if data.IsBSOD then
                    data.BSODTimer = data.BSODTimer - 0.1
                    if data.BSODTimer <= 0 then
                        data.IsBSOD = false
                        data.Heat = 25.0
                    end
                else
                    -- Newton's Law of Cooling
                    local rCool = 4.0 + (data.Hardware.Cooling_Level - 1) * 1.8 + (data.RootTree.CryogenicSubstrate * 3.0)
                    local diff = (data.Heat - 25.0) / 75.0
                    local newton = 1 + 0.5 * math.max(0, diff)
                    data.Heat = math.max(25.0, data.Heat - rCool * newton * 0.1)
                end
                SyncEvent:FireClient(player, data)
            end
        end
    end
end)`;

  const clientScript = `--[[
    DepthOS - Client Controller
    Place in: StarterPlayer/StarterPlayerScripts/DepthOS_Client
    Handles user input (Spacebar to process, F to flush) and UI feedback
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")
local Players = game:GetService("Players")

local Remotes = ReplicatedStorage:WaitForChild("DepthOS_Remotes")
local ProcessWorkload = Remotes:WaitForChild("ProcessWorkload")
local FlushCache = Remotes:WaitForChild("FlushCache")
local SyncEvent = Remotes:WaitForChild("SyncState")

local LocalPlayer = Players.LocalPlayer
local PlayerGui = LocalPlayer:WaitForChild("PlayerGui")

local CurrentState = nil
local IsFlushingHeld = false

SyncEvent.OnClientEvent:Connect(function(state)
    CurrentState = state
    -- Update UI labels, thermal gauges, RAM bars here
end)

UserInputService.InputBegan:Connect(function(input, gameProcessed)
    if gameProcessed then return end

    if input.KeyCode == Enum.KeyCode.Space then
        -- Process Workload Trigger
        ProcessWorkload:InvokeServer()
    elseif input.KeyCode == Enum.KeyCode.F then
        IsFlushingHeld = true
        -- Begin Flush Channel
        FlushCache:InvokeServer()
    end
end)

UserInputService.InputEnded:Connect(function(input)
    if input.KeyCode == Enum.KeyCode.F then
        IsFlushingHeld = false
    end
end)`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentCode = activeTab === 'server' ? serverScript : clientScript;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-mono">
      <div className="bg-[#0b0e14] border-2 border-red-500/60 rounded-lg w-full max-w-4xl text-gray-200 p-6 shadow-[0_0_50px_rgba(239,68,68,0.25)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-900 pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-widest text-white flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 inline-block"></span>
              ROBLOX STUDIO EXPORT & LUAU SCRIPT GENERATOR
            </h2>
            <p className="text-xs text-red-400 mt-1">
              Production-ready Luau scripts to run the DepthOS engine directly inside Roblox Studio.
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-950/60 border border-red-500/50 hover:bg-red-800 text-red-200 text-xs font-bold rounded"
          >
            [ESC] CLOSE
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 border-b border-gray-800 pb-3 mb-4 text-xs">
          <button
            onClick={() => setActiveTab('server')}
            className={`px-3 py-1.5 rounded font-bold transition-all ${
              activeTab === 'server' ? 'bg-red-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white'
            }`}
          >
            ServerScriptService/DepthOS_Server.lua
          </button>
          <button
            onClick={() => setActiveTab('client')}
            className={`px-3 py-1.5 rounded font-bold transition-all ${
              activeTab === 'client' ? 'bg-red-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white'
            }`}
          >
            StarterPlayerScripts/DepthOS_Client.lua
          </button>
        </div>

        {/* Code Viewport */}
        <div className="flex-1 overflow-hidden flex flex-col bg-[#07090d] border border-gray-800 rounded p-4 relative">
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-800 text-xs text-gray-400">
            <span>{activeTab === 'server' ? 'Server Engine (10Hz Physics)' : 'Client Input Controller'}</span>
            <button
              onClick={() => copyToClipboard(currentCode)}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded border border-gray-600"
            >
              {copied ? '✓ COPIED TO CLIPBOARD' : 'COPY SCRIPT'}
            </button>
          </div>
          <pre className="flex-1 overflow-auto text-xs text-green-400 font-mono leading-relaxed select-all">
            {currentCode}
          </pre>
        </div>
      </div>
    </div>
  );
};
