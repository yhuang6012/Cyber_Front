import { PersonItem } from '@/store/useAppStore';
import { Badge } from '@/components/ui/badge';
import { Building2, Briefcase, Users, GraduationCap } from 'lucide-react';

interface PersonCardProps {
  person: PersonItem;
}

export function PersonCard({ person }: PersonCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    const dragData = {
      id: person.id,
      type: 'person',
      title: person.name,
      content: JSON.stringify({
        name: person.name,
        englishName: person.englishName,
        company: person.currentCompany,
        position: person.currentPosition,
        description: person.description,
        techTags: person.techTags,
        educationTags: person.educationTags,
        workTags: person.workTags,
      }, null, 2),
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="border rounded-lg p-4 bg-card hover:shadow-md transition-all cursor-grab active:cursor-grabbing group"
    >
      {/* Header: Name and Position */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="text-base font-semibold truncate">{person.name}</h3>
            {person.englishName && (
              <span className="text-sm text-muted-foreground">({person.englishName})</span>
            )}
          </div>
          {(person.currentCompany || person.currentPosition) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {person.currentCompany && (
                <>
                  <Building2 className="size-3 flex-shrink-0" />
                  <span className="truncate">{person.currentCompany}</span>
                </>
              )}
              {person.currentPosition && (
                <>
                  {person.currentCompany && <span>·</span>}
                  <span className="truncate">{person.currentPosition}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {person.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {person.description}
        </p>
      )}

      {/* Tags - All combined */}
      <div className="space-y-2">
        {/* Tech Tags */}
        {person.techTags && person.techTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {person.techTags.map((tag, idx) => (
              <Badge key={`tech-${idx}`} variant="outline" className="text-xs border-blue-500/40 text-blue-600 dark:text-blue-400">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Education Tags */}
        {person.educationTags && person.educationTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {person.educationTags.map((tag, idx) => (
              <Badge key={`edu-${idx}`} variant="outline" className="text-xs border-purple-500/40 text-purple-600 dark:text-purple-400">
                <GraduationCap className="size-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Work Tags */}
        {person.workTags && person.workTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {person.workTags.map((tag, idx) => (
              <Badge key={`work-${idx}`} variant="outline" className="text-xs border-green-500/40 text-green-600 dark:text-green-400">
                <Briefcase className="size-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Industry Tags */}
        {person.industryTags && person.industryTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {person.industryTags.map((tag, idx) => (
              <Badge key={`industry-${idx}`} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Footer: Related Info */}
      {((person.relatedPersons && person.relatedPersons.length > 0) || 
        (person.institutions && person.institutions.length > 0)) && (
        <div className="mt-3 pt-3 border-t border-border space-y-1.5 text-xs text-muted-foreground">
          {person.relatedPersons && person.relatedPersons.length > 0 && (
            <div className="flex items-start gap-2">
              <Users className="size-3 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">重要人员：</span>
                <span>{person.relatedPersons.join('、')}</span>
              </div>
            </div>
          )}
          {person.institutions && person.institutions.length > 0 && (
            <div className="flex items-start gap-2">
              <Building2 className="size-3 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">主要机构：</span>
                <span>{person.institutions.join('、')}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

