
import React from 'react';
import { CompanyInfo, GroundingChunk } from '../types';

interface ResultCardProps {
  companyInfo: CompanyInfo;
  sources: GroundingChunk[];
}

const InfoRow: React.FC<{ label: string; value: string; isLink?: boolean }> = ({ label, value, isLink = false }) => (
    <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt className="text-sm font-medium text-slate-400">{label}</dt>
        <dd className="mt-1 text-sm text-slate-200 sm:mt-0 sm:col-span-2 break-words">
            {isLink && value !== 'Not found' ? (
                <a href={value.startsWith('http') ? value : `//${value}`} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                    {value}
                </a>
            ) : (
                value
            )}
        </dd>
    </div>
);

const confidenceLevels: Record<string, {description: string; color: string; dotColor: string; borderColor: string;}> = {
  'Match – High Confidence': {
    description: 'The registry number appears on the website. -OR- The legal entity name, street address, and at least one officer/executive name matches.',
    color: 'bg-green-500/20 text-green-300',
    dotColor: 'bg-green-400',
    borderColor: 'border-green-400/50'
  },
  'Match – Medium Confidence': {
    description: 'The legal entity name, city, and/or industry match, but there is no confirmed match of a street address or officer/executive.',
    color: 'bg-yellow-500/20 text-yellow-300',
    dotColor: 'bg-yellow-400',
    borderColor: 'border-yellow-400/50'
  },
  'Match – Low Confidence': {
    description: 'Domain matches casual/DBA names and general locations/industries, but there is no confirmed match between legal names, people, or street address.',
    color: 'bg-orange-500/20 text-orange-300',
    dotColor: 'bg-orange-400',
    borderColor: 'border-orange-400/50'
  },
  'Non-Investable': {
    description: 'The matching domain is for a holding company or shell company and does not actually operate as an investable business.',
    color: 'bg-slate-500/20 text-slate-300',
    dotColor: 'bg-slate-400',
    borderColor: 'border-slate-400/50'
  },
  'No Match': {
    description: 'A domain could not be identified that meets any of the match criteria. If there is a suspected domain, add it to the Notes column.',
    color: 'bg-red-500/20 text-red-300',
    dotColor: 'bg-red-400',
    borderColor: 'border-red-400/50'
  }
};


const ConfidenceDisplay: React.FC<{ selectedLevel: string, justification: string }> = ({ selectedLevel, justification }) => {
  const selectedKey = Object.keys(confidenceLevels).find(key => selectedLevel.includes(key)) || 'No Match';
  const selectedConfidence = confidenceLevels[selectedKey];

  if (!selectedConfidence) {
    return null;
  }

  const { description, color, dotColor, borderColor } = selectedConfidence;

  return (
    <div className="border-t border-slate-700">
      <div className="px-4 py-5 sm:px-6">
        <h4 className="text-md font-semibold text-slate-300 mb-1">Confidence Level Assessment</h4>
        {justification && justification !== 'Not found' && (
            <p className="text-sm text-slate-400 mb-4 italic">"{justification}"</p>
        )}
        <div className={`p-3 rounded-lg border-2 transition-all duration-300 ${color} ${borderColor} shadow-lg ring-2 ring-cyan-400/50 ring-offset-2 ring-offset-slate-800`}>
            <div className="flex items-center">
              <span className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${dotColor}`}></span>
              <h5 className="font-semibold text-white">{selectedKey}</h5>
            </div>
            <p className="mt-1.5 text-xs ml-6 text-slate-300">{description}</p>
        </div>
      </div>
    </div>
  );
};


const ResultCard: React.FC<ResultCardProps> = ({ companyInfo, sources }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm shadow-xl rounded-lg overflow-hidden border border-slate-700 animate-fade-in">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-xl leading-6 font-semibold text-cyan-300">
          {companyInfo.companyName || 'Company Information'}
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Detailed information retrieved from online sources.
        </p>
      </div>
      <div className="border-t border-slate-700">
        <dl className="divide-y divide-slate-700">
          <InfoRow label="Company Name" value={companyInfo.companyName} />
          <InfoRow label="Registry Number" value={companyInfo.registryNumber} />
          <InfoRow label="Location" value={companyInfo.location} />
          <InfoRow label="Country" value={companyInfo.country} />
          <InfoRow label="Website" value={companyInfo.website} isLink={true} />
        </dl>
      </div>
      
      {companyInfo.confidenceLevel && companyInfo.confidenceLevel !== 'Not found' && (
        <ConfidenceDisplay 
            selectedLevel={companyInfo.confidenceLevel} 
            justification={companyInfo.justification}
        />
      )}
      
      {sources.length > 0 && (
        <div className="border-t border-slate-700 px-4 py-4 sm:px-6">
          <h4 className="text-md font-semibold text-slate-300 mb-3">Sources (Proof)</h4>
          <ul className="space-y-2">
            {sources.map((source, index) => (
              source.web && (
                <li key={index} className="flex items-start">
                    <svg className="flex-shrink-0 h-5 w-5 text-green-400 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 text-sm break-all transition-colors">
                    {source.web.title || source.web.uri}
                  </a>
                </li>
              )
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResultCard;