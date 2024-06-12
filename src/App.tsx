import React, { useState, useMemo } from 'react';
import { Autocomplete, TextField, Checkbox, createFilterOptions, Box, Typography } from '@mui/material';
import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface Category {
  id: number;
  name: string;
  parent?: number;
  childCategories?: Category[];
}

interface CategoryOption {
  id: number;
  name: string;
  depth: number;
  parentId?: number;
  matchTerms: string[];
}

const data: Category[] = [
  {
    id: 4,
    name: "Lighting Equipment",
    childCategories: [
      { id: 5, name: "Intelligent" },
      { id: 6, name: "Generic" },
      { id: 8, name: "Generic" },
      {
        id: 9,
        name: "Generic",
        childCategories: [
          { id: 58, name: "Intelligent" },
          { id: 62, name: "Generic" },
          { id: 78, name: "Control" }
        ]
      },
      { id: 60, name: "Generic" },
      { id: 61, name: "Generic" },
      { id: 67, name: "Generic" },
      { id: 68, name: "Generic" },
      { id: 69, name: "Generic" },
      { id: 7, name: "Control" }
    ]
  }
];

const toOptions = (category: Category, depth: number = 0, parentId?: number): CategoryOption[] => {
  const { id, name, childCategories = [] } = category;
  const childrenOptions = childCategories.flatMap(child => toOptions(child, depth + 1, id));
  const option: CategoryOption = {
    id,
    name,
    depth,
    parentId,
    matchTerms: [name, ...childrenOptions.flatMap(child => child.matchTerms)],
  };
  return [option, ...childrenOptions];
};

const CategoryAutocomplete: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const optionsList = useMemo(() => data.flatMap(category => toOptions(category)), []);

  const handleCheckboxChange = (id: number, checked: boolean) => {
    setSelectedIds(prev => {
      let newSelectedIds = new Set(prev);

      const currentOption = optionsList.find(option => option.id === id);
      if (!currentOption) return Array.from(newSelectedIds);

      if (checked) {
        newSelectedIds.add(id);
      } else {
        newSelectedIds.delete(id);
      }

      const updateChildren = (optionId: number, select: boolean) => {
        const children = optionsList.filter(opt => opt.parentId === optionId);
        children.forEach(child => {
          if (select) newSelectedIds.add(child.id);
          else newSelectedIds.delete(child.id);
          updateChildren(child.id, select);
        });
      };

      updateChildren(id, checked);

      const updateParents = (optionId: number) => {
        const parentOption = optionsList.find(option => option.id === optionId);
        if (parentOption) {
          const siblings = optionsList.filter(option => option.parentId === parentOption.id);
          const allSiblingsSelected = siblings.every(sibling => newSelectedIds.has(sibling.id));
          if (allSiblingsSelected) {
            newSelectedIds.add(parentOption.id);
          } else {
            newSelectedIds.delete(parentOption.id);
          }
          if (parentOption.parentId) {
            updateParents(parentOption.parentId);
          }
        }
      };

      if (currentOption.parentId) {
        updateParents(currentOption.parentId);
      }

      return Array.from(newSelectedIds);
    });
  };

  const getIndeterminate = (id: number, selectedIds: number[]): boolean => {
    const childrenIds = optionsList.filter(option => option.parentId === id).map(option => option.id);
    const selectedChildren = childrenIds.filter(childId => selectedIds.includes(childId));
    return selectedChildren.length > 0 && selectedChildren.length < childrenIds.length;
  };

  const handleTagDelete = (tagToDelete: CategoryOption) => {
    setSelectedIds(prev => {
      const newSelectedIds = new Set(prev);
      newSelectedIds.delete(tagToDelete.id);

      const updateChildren = (optionId: number) => {
        const children = optionsList.filter(opt => opt.parentId === optionId);
        children.forEach(child => {
          newSelectedIds.delete(child.id);
          updateChildren(child.id);
        });
      };

      updateChildren(tagToDelete.id);

      const updateParents = (optionId: number) => {
        const parentOption = optionsList.find(option => option.id === optionId);
        if (parentOption) {
          const siblings = optionsList.filter(option => option.parentId === parentOption.id);
          const allSiblingsSelected = siblings.every(sibling => newSelectedIds.has(sibling.id));
          if (allSiblingsSelected) {
            newSelectedIds.add(parentOption.id);
          } else {
            newSelectedIds.delete(parentOption.id);
          }
          if (parentOption.parentId) {
            updateParents(parentOption.parentId);
          }
        }
      };

      if (tagToDelete.parentId) {
        updateParents(tagToDelete.parentId);
      }

      return Array.from(newSelectedIds);
    });
  };

  const handleExpandCollapse = (id: number) => {
    setExpandedIds(prev => {
      const newExpandedIds = new Set(prev);
      if (newExpandedIds.has(id)) {
        newExpandedIds.delete(id);
      } else {
        newExpandedIds.add(id);
      }
      return Array.from(newExpandedIds);
    });
  };

  const renderOptionsWithChildren = (inputValue: string, options: CategoryOption[], depth = 0) => {
    return options.map((option) => {
      const matches = match(option.name, inputValue);
      const parts = parse(option.name, matches);
      const allChildrenIds = optionsList.filter(o => o.parentId === option.id).map(option => option.id);
      const checked = selectedIds.includes(option.id);
      const indeterminate = getIndeterminate(option.id, selectedIds);

      const hasChildren = optionsList.some(opt => opt.parentId === option.id);
      const isExpanded = expandedIds.includes(option.id);

      return inputValue && match(option.matchTerms.join('//'), inputValue).length === 0 ? <></> : (
        <React.Fragment key={option.id}>
          <li
            style={{display: 'flex', alignItems: 'center', paddingLeft: option.depth * 16, lineHeight: "2px", cursor: 'pointer', transition: 'background-color 0.3s' }}
            onClick={(event) => {
              event.stopPropagation();
              handleCheckboxChange(option.id, !selectedIds.includes(option.id));
            }}
            onMouseOver={(event) => {
              event.currentTarget.style.backgroundColor = "#f0f0f0";
            }}
            onMouseOut={(event) => {
              event.currentTarget.style.backgroundColor = "white";
            }}
          >
            {hasChildren ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleExpandCollapse(option.id);
                }}
                style={{cursor: 'pointer', display: 'inline-block'}}
              >
                {isExpanded ? <ExpandMoreIcon sx={{ mr: 0 }} /> : <ChevronRightIcon sx={{ mr: 0 }} />}
              </div>
            ) : <div style={{ width: 24, display: 'inline-block' }} />}
            <Checkbox
              checked={checked}
              indeterminate={indeterminate}
              onChange={(event) => {
                event.stopPropagation();
                handleCheckboxChange(option.id, event.target.checked);
              }}
              onClick={(e) => e.stopPropagation()}
              sx={{ ml:0, padding: "0 9px 0 0" }}
            />
            <div style={{ lineHeight: 2 }}>
              {parts.map((part, index) => (
                <span key={"ppp" + index} style={{ fontWeight: part.highlight ? 700 : 400 }}>
                  {part.text}
                </span>
              ))}
            </div>
          </li>
          {hasChildren && isExpanded && renderOptionsWithChildren(inputValue, optionsList.filter(opt => opt.parentId === option.id), option.depth + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f5f5', padding: 2 }}>
      <Box sx={{ width: '500px', backgroundColor: 'white', borderRadius: '8px', boxShadow: 3, p: 3 }}>
        <Typography variant="h6" align="center" gutterBottom>
          Select Categories
        </Typography>
        <Autocomplete
          multiple
          options={optionsList.filter(option => option.depth === 0)}
          getOptionLabel={(option) => option.name}
          value={optionsList.filter(option => selectedIds.includes(option.id) && !getIndeterminate(option.id, selectedIds))}
          onChange={(event, newValue, reason) => {
            if (reason === 'removeOption') {
              const removedOption = selectedIds.find(id => !newValue.map(option => option.id).includes(id));
              if (removedOption !== undefined) {
                handleTagDelete(optionsList.find(option => option.id === removedOption) as CategoryOption);
              }
            } else {
              setSelectedIds(newValue.map(item => item.id));
            }
          }}
          renderOption={(props, option, { inputValue }) => {
            return (renderOptionsWithChildren(inputValue, [option], 0));
          }}
          renderInput={(params) => <TextField {...params} label="Type or select categories" variant="outlined" fullWidth />}
          filterOptions={createFilterOptions({
            stringify: (option) => option.matchTerms.join("//"),
          })}
          sx={{
            '.MuiAutocomplete-tag': {
              backgroundColor: '#e7ecf3',
              border: '1px solid #7491b8',
              borderRadius: '4px',
              padding: '2px 4px',
            },
            '.MuiAutocomplete-inputRoot': {
              padding: '6px 12px',
            },
            '.MuiAutocomplete-endAdornment': {
              right: '8px',
            },
            '.MuiFormControl-root': {
              marginTop: '8px',
              
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default CategoryAutocomplete;
